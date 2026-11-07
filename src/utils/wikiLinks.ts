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

/**
 * Menghasilkan judul catatan unik dengan suffix nomor berurutan jika judul dasar sudah digunakan.
 * Contoh:
 * Jika belum ada: "Catatan Baru" -> "Catatan Baru"
 * Jika sudah ada: "Catatan Baru" -> "Catatan Baru 1"
 * Jika sudah ada "Catatan Baru 1": -> "Catatan Baru 2"
 */
export function generateUniqueTitle(
  baseTitle: string = 'Catatan Baru',
  existingTitles: string[] = []
): string {
  const cleanBase = (baseTitle || 'Catatan Baru').trim();
  const normalizedExisting = new Set(
    existingTitles.map((t) => normalizeNoteTitle(t))
  );

  // Jika judul dasar belum digunakan sama sekali, gunakan langsung
  if (!normalizedExisting.has(normalizeNoteTitle(cleanBase))) {
    return cleanBase;
  }

  // Cek apakah baseTitle sudah berakhiran angka (contoh: "Catatan Baru 2")
  const match = cleanBase.match(/^(.*?)(?:\s+(\d+))$/);
  let prefix = cleanBase;
  let startNum = 1;

  if (match) {
    prefix = match[1].trim();
    startNum = parseInt(match[2], 10) + 1;
  }

  let counter = startNum;
  while (normalizedExisting.has(normalizeNoteTitle(`${prefix} ${counter}`))) {
    counter++;
  }

  return `${prefix} ${counter}`;
}
