#!/usr/bin/env python3
"""
Server-side copy of objects between S3 buckets (nothing is downloaded), optionally limited to a
list of keys. Resumable: objects already in the destination with the same size are skipped.
Run in AWS CloudShell (us-east-1).

Usage:
  # files the app uses: prod source -> prod delivery
  python3 s3-copy-keys.py vyoma-ott-prod-media-source vyoma-ott-prod-media-delivery --keys ott-files-needed-keys.txt
  # same set into dev for testing
  python3 s3-copy-keys.py vyoma-ott-prod-media-source vyoma-ott-dev-media-delivery --keys ott-files-needed-keys.txt
  # everything under a prefix
  python3 s3-copy-keys.py vyoma-ott-prod-media-source vyoma-ott-dev-media-source --prefix Images/

--keys file: one object key per line (as in the bucket, not URL-encoded).
"""
import argparse
import datetime
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import boto3
from boto3.s3.transfer import TransferConfig
from botocore.config import Config


def list_sizes(s3, bucket: str, prefix: str = ""):
    sizes = {}
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            sizes[obj["Key"]] = obj["Size"]
    return sizes


def main():
    ap = argparse.ArgumentParser(description="Server-side S3 to S3 copy")
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--keys", help="file with one key per line; default: every object (under --prefix)")
    ap.add_argument("--prefix", default="", help="only keys under this prefix")
    ap.add_argument("--workers", type=int, default=64, help="parallel copies (default 64)")
    args = ap.parse_args()

    s3 = boto3.client("s3", config=Config(max_pool_connections=args.workers * 2,
                                          retries={"max_attempts": 10, "mode": "adaptive"}))
    # copy() uses multipart copy above the threshold, so files over 5 GB also work
    transfer = TransferConfig(multipart_threshold=1024 * 1024 * 1024, max_concurrency=4)

    print(f"Listing s3://{args.src}/{args.prefix} ...", flush=True)
    src = list_sizes(s3, args.src, args.prefix)
    if args.keys:
        wanted = [line.rstrip("\n") for line in open(args.keys) if line.strip()]
        missing = [k for k in wanted if k not in src]
        keys = [k for k in wanted if k in src]
        if missing:
            print(f"WARNING: {len(missing)} listed keys are not in the source bucket (first: {missing[0]})")
    else:
        keys = sorted(src)

    print(f"Listing s3://{args.dst}/{args.prefix} ...", flush=True)
    dst = list_sizes(s3, args.dst, args.prefix)
    todo = [k for k in keys if dst.get(k) != src[k]]
    todo_bytes = sum(src[k] for k in todo)
    print(f"{len(keys) - len(todo)} already there; {len(todo)} to copy ({todo_bytes / 1e9:.2f} GB)", flush=True)

    def copy(key):
        try:
            s3.copy({"Bucket": args.src, "Key": key}, args.dst, key, Config=transfer)
            return None
        except Exception as exc:  # reported per key; re-run to retry
            return f"{type(exc).__name__}: {exc}"

    log_name = f"s3-copy-{datetime.datetime.now():%Y%m%d-%H%M%S}.log"
    lock = threading.Lock()
    done = failed = 0
    done_bytes = 0
    started = last = time.time()
    with open(log_name, "w") as log, ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(copy, k): k for k in todo}
        for fut in as_completed(futures):
            key, error = futures[fut], fut.result()
            with lock:
                if error:
                    failed += 1
                    log.write(f"FAIL\t{key}\t{error}\n")
                    print(f"  FAILED {key}: {error}", flush=True)
                else:
                    done += 1
                    done_bytes += src[key]
                    log.write(f"OK\t{key}\n")
                now = time.time()
                if now - last >= 15 or done + failed == len(todo):
                    last = now
                    print(f"[{done + failed}/{len(todo)} files, {done_bytes / 1e9:.2f}/{todo_bytes / 1e9:.2f} GB, "
                          f"{(done + failed) / max(now - started, 1):.0f} files/s, {failed} failed]", flush=True)

    print(f"Done: {done} copied, {len(keys) - len(todo)} already there, {failed} failed. Log: {log_name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
