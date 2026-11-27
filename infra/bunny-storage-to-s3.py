#!/usr/bin/env python3
"""
Copy a whole Bunny Storage zone into an S3 bucket, streaming (no local disk needed).
Built for large zones (100k+ small files): parallel listing, parallel uploads, resumable.
Run in AWS CloudShell (us-east-1), which is already authenticated and has boto3 installed.

Environment (set in the shell, never commit these):
  BUNNY_STORAGE_ZONE   storage zone name, e.g. ott-files
  BUNNY_STORAGE_KEY    storage zone password, NOT the account API key
                       (Bunny > Storage > zone > Access / FTP & API Access > Password)
  BUNNY_STORAGE_HOST   regional endpoint shown on the same page, default storage.bunnycdn.com

Usage (large zones: run small-file folders with many workers, Videos/ with few):
  python3 bunny-storage-to-s3.py --list-only                         # inventory -> bunny-inventory.tsv
  python3 bunny-storage-to-s3.py vyoma-ott-dev-media-source --prefix Audio/
  python3 bunny-storage-to-s3.py vyoma-ott-prod-media-source         # everything

Object key = the path inside the storage zone (e.g. "Videos/A B/x.mp4"), so it matches the CDN
path https://digitalsanskrit.b-cdn.net/Videos/A%20B/x.mp4. Files already in S3 with the same size
are skipped, so re-running after an interruption resumes where it stopped.
"""
import argparse
import collections
import datetime
import http.client
import json
import mimetypes
import os
import sys
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import boto3
    from boto3.s3.transfer import TransferConfig
    from botocore.config import Config
except ImportError:
    sys.exit("boto3 is required (preinstalled in CloudShell). Elsewhere: pip install --user boto3")

ZONE = os.environ.get("BUNNY_STORAGE_ZONE", "")
KEY = os.environ.get("BUNNY_STORAGE_KEY", "")
HOST = os.environ.get("BUNNY_STORAGE_HOST", "storage.bunnycdn.com")

for ext, ctype in {".m4a": "audio/mp4", ".vtt": "text/vtt", ".wasm": "application/wasm",
                   ".json": "application/json", ".webp": "image/webp", ".svg": "image/svg+xml",
                   ".mjs": "text/javascript", ".js": "text/javascript", ".woff2": "font/woff2"}.items():
    mimetypes.add_type(ctype, ext)


class BunnyError(Exception):
    def __init__(self, status: int):
        super().__init__(f"HTTP {status}")
        self.status = status


class Stats:
    """Thread-safe counters for retries and non-200 Bunny responses, shown in the progress line."""

    def __init__(self):
        self.lock = threading.Lock()
        self.retries = 0
        self.statuses = collections.Counter()

    def retry(self, reason):
        with self.lock:
            self.retries += 1
            self.statuses[reason] += 1

    def summary(self):
        with self.lock:
            detail = ", ".join(f"{k}: {v}" for k, v in self.statuses.most_common(3))
            return f"{self.retries} retries" + (f" ({detail})" if detail else "")


STATS = Stats()
_local = threading.local()


def make_connection():
    return http.client.HTTPSConnection(HOST, timeout=120)


def reset_connection():
    conn = getattr(_local, "conn", None)
    if conn is not None:
        conn.close()
    _local.conn = None


def bunny_get(path: str):
    """GET over this thread's keep-alive connection (one TLS handshake per worker, not per file).
    Returns the response; the caller must read the body completely."""
    url_path = f"/{urllib.parse.quote(ZONE)}/{urllib.parse.quote(path)}"
    for attempt in range(2):
        if getattr(_local, "conn", None) is None:
            _local.conn = make_connection()
        try:
            _local.conn.request("GET", url_path, headers={"AccessKey": KEY, "Accept": "*/*"})
            resp = _local.conn.getresponse()
        except (http.client.HTTPException, OSError):
            reset_connection()  # server closed an idle keep-alive connection: reconnect once
            if attempt:
                raise
            continue
        if resp.status != 200:
            resp.read()
            raise BunnyError(resp.status)
        return resp


def list_dir(directory: str):
    """Return ([(key, size)], [subdirs]) for one directory, retrying transient errors."""
    for attempt in range(4):
        try:
            entries = json.loads(bunny_get(directory).read())
            break
        except BunnyError as exc:
            if exc.status in (401, 403, 404) or attempt == 3:
                raise
            STATS.retry(f"list HTTP {exc.status}")
        except (http.client.HTTPException, OSError):
            reset_connection()
            if attempt == 3:
                raise
            STATS.retry("list network")
        time.sleep(2 ** attempt)
    files, dirs = [], []
    for e in entries:
        # Path looks like "/<zone>/Videos/Sub/"; strip the zone to get the key prefix
        parts = e["Path"].split("/", 2)
        key = (parts[2] if len(parts) > 2 else "") + e["ObjectName"]
        if e["IsDirectory"]:
            dirs.append(key + "/")
        else:
            files.append((key, int(e["Length"])))
    return files, dirs


def list_files(prefix: str, workers: int):
    """Walk the zone breadth-first, listing directories in parallel."""
    files, pending, seen_dirs = [], [prefix], 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        while pending:
            batch, pending = pending, []
            for fut in as_completed([pool.submit(list_dir, d) for d in batch]):
                f, d = fut.result()
                files.extend(f)
                pending.extend(d)
                seen_dirs += 1
            print(f"  listed {seen_dirs} folders, {len(files)} files so far", flush=True)
    return files


def existing_sizes(s3, bucket: str, prefix: str):
    sizes = {}
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            sizes[obj["Key"]] = obj["Size"]
    return sizes


class CountingReader:
    """File-like wrapper that counts bytes, so a truncated download is detected without a HEAD."""

    def __init__(self, raw):
        self.raw, self.count = raw, 0

    def read(self, n=-1):
        chunk = self.raw.read(n)
        self.count += len(chunk)
        return chunk


def copy_one(s3, bucket: str, key: str, size: int, transfer: TransferConfig, chunk: int):
    ctype = mimetypes.guess_type(key)[0] or "application/octet-stream"
    last_error = None
    for attempt in range(5):
        try:
            resp = bunny_get(key)
            if size < chunk:
                # Small file (most Flipbook/Game assets): one in-memory PUT, no transfer manager overhead
                body = resp.read()
                if len(body) != size:
                    raise IOError(f"size mismatch: source {size}, read {len(body)}")
                s3.put_object(Bucket=bucket, Key=key, Body=body, ContentType=ctype)
            else:
                reader = CountingReader(resp)
                s3.upload_fileobj(reader, bucket, key, ExtraArgs={"ContentType": ctype}, Config=transfer)
                if reader.count != size:
                    s3.delete_object(Bucket=bucket, Key=key)
                    raise IOError(f"size mismatch: source {size}, read {reader.count}")
            return None
        except BunnyError as exc:
            last_error = exc
            if exc.status in (401, 403, 404):
                break
            STATS.retry(f"HTTP {exc.status}")
            time.sleep(min(2 ** attempt, 15) * (2 if exc.status == 429 else 1))
        except Exception as exc:  # network hiccup or S3 error: fresh connection, then retry
            last_error = exc
            reset_connection()
            STATS.retry(type(exc).__name__)
            time.sleep(min(2 ** attempt, 15))
    return f"{type(last_error).__name__}: {last_error}"


def main():
    ap = argparse.ArgumentParser(description="Copy a Bunny Storage zone into S3")
    ap.add_argument("bucket", nargs="?", help="destination S3 bucket")
    ap.add_argument("--prefix", default="", help="only copy keys under this folder, e.g. Audio/")
    ap.add_argument("--list-only", action="store_true", help="write bunny-inventory.tsv and exit")
    ap.add_argument("--workers", type=int, default=32, help="parallel transfers (default 32)")
    ap.add_argument("--chunk-mb", type=int, default=16,
                    help="multipart part size in MB (default 16); memory per large file ~3x this")
    args = ap.parse_args()

    if not ZONE or not KEY:
        sys.exit("Set BUNNY_STORAGE_ZONE and BUNNY_STORAGE_KEY first (see the top of this file).")
    if not args.list_only and not args.bucket:
        sys.exit("Give a destination bucket, or use --list-only.")
    if args.prefix and not args.prefix.endswith("/"):
        args.prefix += "/"

    print(f"Listing Bunny zone '{ZONE}' {args.prefix or '(all)'} ...", flush=True)
    try:
        files = list_files(args.prefix, args.workers)
    except BunnyError as exc:
        hint = " - check BUNNY_STORAGE_KEY (zone password) and BUNNY_STORAGE_HOST (region)" if exc.status == 401 else ""
        sys.exit(f"Bunny Storage listing failed: HTTP {exc.status}{hint}")
    files.sort()
    total = sum(s for _, s in files)
    with open("bunny-inventory.tsv", "w") as inv:
        for key, size in files:
            inv.write(f"{size}\t{key}\n")
    print(f"Found {len(files)} files, {total / 1e9:.2f} GB (written to bunny-inventory.tsv)", flush=True)
    if args.list_only:
        return

    s3 = boto3.client("s3", config=Config(max_pool_connections=args.workers * 2,
                                          retries={"max_attempts": 10, "mode": "adaptive"}))
    # A streamed (non-seekable) upload buffers each part in memory: ~chunk x (concurrency + 1) per file.
    # CloudShell has ~2 GB RAM, so keep parts small and use few workers for large files (e.g. Videos/).
    chunk = args.chunk_mb * 1024 * 1024
    transfer = TransferConfig(multipart_threshold=chunk, multipart_chunksize=chunk,
                              max_concurrency=2, use_threads=True)

    print(f"Checking what is already in s3://{args.bucket}/{args.prefix} ...", flush=True)
    have = existing_sizes(s3, args.bucket, args.prefix)
    todo = [(k, s) for k, s in files if have.get(k) != s]
    todo_bytes = sum(s for _, s in todo)
    print(f"{len(files) - len(todo)} already copied; {len(todo)} to copy ({todo_bytes / 1e9:.2f} GB)", flush=True)

    log_name = f"bunny-copy-{datetime.datetime.now():%Y%m%d-%H%M%S}.log"
    lock = threading.Lock()
    done = failed = 0
    done_bytes = 0
    started = last_report = time.time()

    with open(log_name, "w") as log, ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(copy_one, s3, args.bucket, k, s, transfer, chunk): (k, s) for k, s in todo}
        for fut in as_completed(futures):
            key, size = futures[fut]
            error = fut.result()
            with lock:
                if error:
                    failed += 1
                    log.write(f"FAIL\t{key}\t{error}\n")
                    print(f"  FAILED {key}: {error}", flush=True)
                else:
                    done += 1
                    done_bytes += size
                    log.write(f"OK\t{key}\n")
                now = time.time()
                if now - last_report >= 15 or done + failed == len(todo):
                    last_report = now
                    rate = done_bytes / max(now - started, 1)
                    fps = (done + failed) / max(now - started, 1)
                    # many small files: file count dominates; few large files: bytes dominate
                    eta = max((todo_bytes - done_bytes) / rate if rate else 0,
                              (len(todo) - done - failed) / fps if fps else 0) / 60
                    print(f"[{done + failed}/{len(todo)} files, {done_bytes / 1e9:.2f}/{todo_bytes / 1e9:.2f} GB, "
                          f"{fps:.0f} files/s, {rate / 1e6:.1f} MB/s, "
                          f"about {eta:.0f} min left, {failed} failed, {STATS.summary()}]", flush=True)
                    log.flush()

    print(f"Done: {done} copied, {len(files) - len(todo)} already there, {failed} failed. Log: {log_name}")
    if failed:
        print("Re-run the same command to retry the failed files.")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
