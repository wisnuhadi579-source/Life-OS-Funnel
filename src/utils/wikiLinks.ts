/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedWikiLink } from '../types/secondBrain';

/**
 * Normalisasi judul catatan untuk perbandingan case-insensitive dan spasi rapi
 */
export function normalizeNoteTitle(title: string): string {
  return (title || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Ekstrak seluruh Wiki Links [[Judul Catatan]] dari isi teks Markdown.
 * Ketentuan:
 * - Mengabaikan fenced code blocks (``` ... ```)
 * - Mengabaikan inline code (` ... `)
 * - Menghapus duplikasi judul (case-insensitive)
 * - Mengabaikan judul kosong
 * - Mempertahankan teks asli
 */
export function extractWikiLinks(content: string): ExtractedWikiLink[] {
  if (!content) return [];

  // 1. Bersihkan fenced code blocks agar tidak terbaca
  let sanitized = content.replace(/```[\s\S]*?```/g, '');

  // 2. Bersihkan inline code
  sanitized = sanitized.replace(/`[^`\n]+`/g, '');

  // 3. Tangkap semua pola [[ ... ]]
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = wikiLinkRegex.exec(sanitized)) !== null) {
    const rawTitle = match[1];
    if (rawTitle) {
      // Hilangkan alias bila ada, e.g. [[Judul|Alias]] -> 'Judul'
      const cleanTitle = rawTitle.split('|')[0].trim();
      if (cleanTitle.length > 0) {
        matches.push(cleanTitle);
      }
    }
  }

  // 4. Hapus duplikasi berdasarkan normalisasi
  const seen = new Set<string>();
  const uniqueLinks: ExtractedWikiLink[] = [];

  for (const title of matches) {
    const key = normalizeNoteTitle(title);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLinks.push({ target_title: title });
    }
  }

  return uniqueLinks;
}
