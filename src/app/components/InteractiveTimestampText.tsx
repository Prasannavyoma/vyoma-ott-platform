"use client";

import React from 'react';
import { parseTimestamp, seekToTimestamp } from '@/lib/timestamps';

interface InteractiveTimestampTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Parses freeform text and converts any timestamp like "01:25" or "1:05:30"
 * into an interactive, clickable seek button.
 */
export default function InteractiveTimestampText({ text, style, className }: InteractiveTimestampTextProps) {
  if (!text) return null;

  // Regex matching HH:MM:SS or MM:SS optionally surrounded by brackets/parens
  const regex = /(?:\[|\()?\b(\d{1,2}:\d{2}(?::\d{2})?)\b(?:\]|\))?/g;

  // Break text into lines to preserve formatting
  const lines = text.split(/\r?\n/);

  return (
    <div style={style} className={className}>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} style={{ height: '0.8em' }} />;
        }

        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        // Reset regex state for each line
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
          const matchStart = match.index;
          const matchEnd = regex.lastIndex;
          const timeStr = match[1];
          const rawMatch = match[0];

          // Text before match
          if (matchStart > lastIndex) {
            elements.push(line.substring(lastIndex, matchStart));
          }

          const seconds = parseTimestamp(timeStr);

          if (seconds !== null) {
            elements.push(
              <button
                key={`${lineIdx}_${matchStart}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  seekToTimestamp(seconds);
                }}
                title={`Jump video to ${timeStr}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(242, 100, 34, 0.15)',
                  border: '1px solid rgba(242, 100, 34, 0.4)',
                  color: '#f26422',
                  borderRadius: '6px',
                  padding: '1px 7px',
                  margin: '0 3px',
                  fontSize: '0.88em',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  verticalAlign: 'baseline',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 6px rgba(242, 100, 34, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f26422';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(242, 100, 34, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(242, 100, 34, 0.15)';
                  e.currentTarget.style.color = '#f26422';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(242, 100, 34, 0.15)';
                }}
              >
                <span style={{ fontSize: '0.7em', opacity: 0.8 }}>▶</span>
                <span>{timeStr}</span>
              </button>
            );
          } else {
            elements.push(rawMatch);
          }

          lastIndex = matchEnd;
        }

        // Remaining text on line
        if (lastIndex < line.length) {
          elements.push(line.substring(lastIndex));
        }

        return (
          <div key={lineIdx} style={{ lineHeight: '1.7', minHeight: '1.4em' }}>
            {elements}
          </div>
        );
      })}
    </div>
  );
}
