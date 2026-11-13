"use client";

import React from "react";
import type { SourceItem } from "./types";

type MarkdownProps = {
  text: string;
  sources?: SourceItem[];
  onCitation?: (index: number) => void;
};

function renderInline(
  text: string,
  sources: SourceItem[] | undefined,
  onCitation: ((index: number) => void) | undefined,
  keyPrefix: string
): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[\d+\]|【\d+】|\[[^\]]+\]\([^)]+\))/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-i${index++}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-[var(--ai-surface-2)] px-1.5 py-0.5 text-[0.9em] text-[var(--ai-text)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (/^[\[【]\d+[\]】]$/.test(token)) {
      const citation = Number(token.replace(/\D/g, ""));
      const valid = !!sources && citation >= 1 && citation <= sources.length;
      if (valid) {
        nodes.push(
          <button
            key={key}
            type="button"
            onClick={() => onCitation?.(citation - 1)}
            aria-label={`Source ${citation}: ${sources?.[citation - 1]?.title ?? ""}`}
            className="mx-0.5 inline-flex h-5 min-w-5 translate-y-[-1px] items-center justify-center rounded-full bg-[var(--ai-lake)] px-1 text-[11px] font-semibold text-[var(--ai-primary)] align-middle transition-colors hover:bg-[var(--ai-primary)] hover:text-[var(--ai-on-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
          >
            {citation}
          </button>
        );
      } else {
        nodes.push(token);
      }
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const href = link[2].trim();
        const safe = /^https?:\/\//i.test(href) || href.startsWith("/");
        nodes.push(
          safe ? (
            <a
              key={key}
              href={href}
              target={href.startsWith("/") ? undefined : "_blank"}
              rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
              className="font-medium text-[var(--ai-primary)] underline decoration-[var(--ai-primary)]/30 underline-offset-2 hover:decoration-[var(--ai-primary)]"
            >
              {link[1]}
            </a>
          ) : (
            link[1]
          )
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function startsBlock(line: string) {
  return (
    /^\s*```/.test(line) ||
    /^#{1,6}\s+/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^\s*([-*_])\1{2,}\s*$/.test(line)
  );
}

export default function Markdown({ text, sources, onCitation }: MarkdownProps) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const language = line.trim().replace(/^```/, "").trim();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre
          key={`b${blockKey++}`}
          className="overflow-x-auto rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface-2)] p-3 text-[13px] leading-relaxed"
        >
          <code className="font-mono text-[var(--ai-text)]">{code.join("\n")}</code>
          {language ? <span className="sr-only">{language}</span> : null}
        </pre>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], sources, onCitation, `h${blockKey}`);
      blocks.push(
        level <= 2 ? (
          <h3 key={`b${blockKey++}`} className="pt-1 text-[17px] font-semibold tracking-[-0.01em] text-[var(--ai-text)]">
            {content}
          </h3>
        ) : (
          <h4 key={`b${blockKey++}`} className="pt-1 text-[15px] font-semibold text-[var(--ai-text)]">
            {content}
          </h4>
        )
      );
      i += 1;
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={`b${blockKey++}`} className="border-[var(--ai-border)]" />);
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`b${blockKey++}`} className="list-disc space-y-1.5 pl-5 marker:text-[var(--ai-primary)]">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, sources, onCitation, `ul${blockKey}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`b${blockKey++}`} className="list-decimal space-y-1.5 pl-5 marker:text-[var(--ai-primary)]">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, sources, onCitation, `ol${blockKey}-${itemIndex}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`b${blockKey++}`}
          className="border-l-2 border-[var(--ai-primary)] pl-3 text-[var(--ai-muted)]"
        >
          {renderInline(quoted.join(" "), sources, onCitation, `q${blockKey}`)}
        </blockquote>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={`b${blockKey++}`}>
        {renderInline(paragraph.join(" "), sources, onCitation, `p${blockKey}`)}
      </p>
    );
  }

  return <div className="ai-prose space-y-3 text-[15px] leading-[1.7]">{blocks}</div>;
}
