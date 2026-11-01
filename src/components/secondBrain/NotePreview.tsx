/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link2, Plus, ExternalLink } from 'lucide-react';
import { Note } from '../../types/secondBrain';
import { normalizeNoteTitle } from '../../utils/wikiLinks';

interface NotePreviewProps {
  content: string;
  allNotes: Note[];
  onOpenNoteByTitle: (title: string) => void;
  onCreateFromWikiLink: (title: string) => void;
}

export const NotePreview: React.FC<NotePreviewProps> = ({
  content,
  allNotes,
  onOpenNoteByTitle,
  onCreateFromWikiLink,
}) => {
  // Build lookup set of existing note titles (normalized)
  const existingNotesMap = useMemo(() => {
    const map = new Map<string, Note>();
    allNotes.forEach((n) => {
      map.set(normalizeNoteTitle(n.title), n);
    });
    return map;
  }, [allNotes]);

  /**
   * Pre-process content:
   * Replace [[Judul Catatan]] with custom link syntax [Judul Catatan](wikilink:Judul Catatan)
   * while preserving fenced code blocks and inline code.
   */
  const processedContent = useMemo(() => {
    if (!content) return '';

    // Split by code blocks to avoid transforming wiki links inside code
    const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g);

    return parts
      .map((part) => {
        // If this part is a code block, leave it untouched
        if (part.startsWith('```') || part.startsWith('`')) {
          return part;
        }

        // Replace [[Target]] with custom wikilink protocol
        return part.replace(/\[\[(.*?)\]\]/g, (_match, raw) => {
          const title = (raw || '').trim();
          if (!title) return '';
          // URL encode the title for safe markdown link
          return `[${title}](wikilink:${encodeURIComponent(title)})`;
        });
      })
      .join('');
  }, [content]);

  return (
    <div className="prose prose-invert prose-cyan max-w-none text-slate-200 text-sm leading-relaxed select-text font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-2xl font-black text-white mt-6 mb-3 pb-2 border-b border-[#1E3A5F] tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white mt-5 mb-2.5 pb-1 border-b border-[#1E3A5F]/60 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-cyan-300 mt-4 mb-2">
              {children}
            </h3>
          ),
          // Paragraph
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-500 pl-4 py-1 my-3 bg-[#0B2545]/60 rounded-r-xl italic text-slate-300">
              {children}
            </blockquote>
          ),
          // Code block
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-[#0B2545] border border-[#1E3A5F] text-cyan-300 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3.5 my-3 rounded-xl bg-[#061A32] border border-[#15385F] overflow-x-auto font-mono text-xs text-slate-200">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          // Custom Link / Wiki Link handler
          a: ({ href, children }) => {
            if (href && href.startsWith('wikilink:')) {
              const rawTitle = decodeURIComponent(href.replace('wikilink:', ''));
              const normKey = normalizeNoteTitle(rawTitle);
              const isResolved = existingNotesMap.has(normKey);

              if (isResolved) {
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenNoteByTitle(rawTitle);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                    title={`Buka catatan: ${rawTitle}`}
                  >
                    <Link2 className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>{children}</span>
                  </button>
                );
              }

              // Unresolved link
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onCreateFromWikiLink(rawTitle);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-dashed border-amber-500/40 text-xs font-medium transition-all cursor-pointer shadow-sm group"
                  title={`Catatan "${rawTitle}" belum ada. Klik untuk membuat baru.`}
                >
                  <Plus className="w-2.5 h-2.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>{children}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                    + Buat
                  </span>
                </button>
              );
            }

            // Normal external link
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline-block" />
              </a>
            );
          },
          // Lists
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-[#1E3A5F]">
              <table className="min-w-full divide-y divide-[#1E3A5F] text-xs text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#0B2545]">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3.5 py-2 font-bold text-white border-b border-[#1E3A5F]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 border-b border-[#1E3A5F]/60 text-slate-300">
              {children}
            </td>
          ),
          hr: () => <hr className="my-5 border-[#1E3A5F]" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
