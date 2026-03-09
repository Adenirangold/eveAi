import bibleData from "@/Bible.json";

const bible = bibleData as Record<string, string>;

const BOOK_NAMES = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalm",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Qoheleth",
  "Song of Solomon",
  "Song of Songs",
  "Song of Song",
  "Canticles",
  "Canticle of Canticles",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
  "Revelations",
  "First Samuel",
  "Second Samuel",
  "First Kings",
  "Second Kings",
  "First Chronicles",
  "Second Chronicles",
  "First Corinthians",
  "Second Corinthians",
  "First Thessalonians",
  "Second Thessalonians",
  "First Timothy",
  "Second Timothy",
  "First Peter",
  "Second Peter",
  "First John",
  "Second John",
  "Third John",
];

const BOOK_ALIASES: Record<string, string> = {
  // Singular ↔ Plural variants
  Psalm: "Psalms",

  // Common alternate spellings / shortenings
  "Song of Songs": "Song of Solomon",
  "Song of Song": "Song of Solomon",
  Canticles: "Song of Solomon",
  "Canticle of Canticles": "Song of Solomon",

  Ecclesiastes: "Ecclesiastes", // sometimes "Qoheleth"
  Qoheleth: "Ecclesiastes",

  Revelation: "Revelation", // sometimes written as:
  Revelations: "Revelation",
  Rev: "Revelation",

  // Numbered books — "First/Second/Third" spelled out
  "1 Samuel": "1 Samuel",
  "First Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "Second Samuel": "2 Samuel",

  "1 Kings": "1 Kings",
  "First Kings": "1 Kings",
  "2 Kings": "2 Kings",
  "Second Kings": "2 Kings",

  "1 Chronicles": "1 Chronicles",
  "First Chronicles": "1 Chronicles",
  "2 Chronicles": "2 Chronicles",
  "Second Chronicles": "2 Chronicles",

  "1 Corinthians": "1 Corinthians",
  "First Corinthians": "1 Corinthians",
  "2 Corinthians": "2 Corinthians",
  "Second Corinthians": "2 Corinthians",

  "1 Thessalonians": "1 Thessalonians",
  "First Thessalonians": "1 Thessalonians",
  "2 Thessalonians": "2 Thessalonians",
  "Second Thessalonians": "2 Thessalonians",

  "1 Timothy": "1 Timothy",
  "First Timothy": "1 Timothy",
  "2 Timothy": "2 Timothy",
  "Second Timothy": "2 Timothy",

  "1 Peter": "1 Peter",
  "First Peter": "1 Peter",
  "2 Peter": "2 Peter",
  "Second Peter": "2 Peter",

  "1 John": "1 John",
  "First John": "1 John",
  "2 John": "2 John",
  "Second John": "2 John",
  "3 John": "3 John",
  "Third John": "3 John",

  Philippians: "Philippians", // sometimes "Philip."
  Philemon: "Philemon",

  // OT alternate names
  Genesis: "Genesis",
  Deuteronomy: "Deuteronomy",
  Lamentations: "Lamentations",
  Ezekiel: "Ezekiel",
  Zechariah: "Zechariah",
  Zephaniah: "Zephaniah",
};

export function cleanRef(ref: string): string {
  // Sort longest first so "Song of Solomon" matches before "Song"
  const sorted = [...BOOK_NAMES].sort((a, b) => b.length - a.length);
  for (const book of sorted) {
    const regex = new RegExp(`${book}\\s+\\d+:\\d+`, "i");
    const match = ref.match(regex);
    if (match) {
      return match[0];
    }
  }
  return ref.trim() ?? "";
}

/**
 * Produces a user-facing label for a Bible reference.
 *
 * Examples:
 * - "exodus 7:14-12"  → "Exodus 7:12-14"
 * - "Exodus 7:12-14"  → "Exodus 7:12-14"
 * - "John 3:16-18"    → "John 3:16-18"
 * - "john 3:16"       → "John 3:16"
 * - "Exodus 7:14-8:12" → "Exodus 7:14-8:12" (preserves explicit cross-chapter)
 */
export function formatRefLabel(ref: string): string {
  const trimmed = ref.trim();
  const normalized = normalizeRef(trimmed);

  // 1) Explicit cross-chapter ranges
  const cross = normalized.match(/^(.+?)\s(\d+):(\d+)-(\d+):(\d+)$/);
  if (cross) {
    const [, book, c1s, v1s, c2s, v2s] = cross;
    let c1 = parseInt(c1s, 10);
    let v1 = parseInt(v1s, 10);
    let c2 = parseInt(c2s, 10);
    let v2 = parseInt(v2s, 10);

    if (
      Number.isNaN(c1) ||
      Number.isNaN(v1) ||
      Number.isNaN(c2) ||
      Number.isNaN(v2)
    ) {
      return cleanRef(normalized);
    }

    // If the range is backwards, swap it
    if (c2 < c1 || (c2 === c1 && v2 < v1)) {
      [c1, c2] = [c2, c1];
      [v1, v2] = [v2, v1];
    }

    // If after swapping it's actually same-chapter, collapse to simple form
    if (c1 === c2) {
      const from = Math.min(v1, v2);
      const to = Math.max(v1, v2);
      return `${book} ${c1}:${from}-${to}`;
    }

    return `${book} ${c1}:${v1}-${c2}:${v2}`;
  }

  // 2) Same-chapter ranges (order-insensitive)
  const same = normalized.match(/^(.+?)\s(\d+):(\d+)-(\d+)$/);
  if (same) {
    const [, book, chapStr, v1s, v2s] = same;
    const chap = parseInt(chapStr, 10);
    const v1 = parseInt(v1s, 10);
    const v2 = parseInt(v2s, 10);

    if (Number.isNaN(chap) || Number.isNaN(v1) || Number.isNaN(v2)) {
      return cleanRef(normalized);
    }

    const from = Math.min(v1, v2);
    const to = Math.max(v1, v2);
    return `${book} ${chap}:${from}-${to}`;
  }

  // 3) Fallback to the existing cleaner (single-verse or unknown formats)
  return cleanRef(normalized);
}

export interface BibleVerse {
  ref: string;
  text: string;
}

const MAX_VERSES_PER_CHAPTER = 200;

/**
 * Expands a reference like "John 3:16-18" into ["John 3:16", "John 3:17", "John 3:18"].
 * Also supports:
 * - Cross-chapter ranges with explicit end chapter, e.g. "Exodus 7:14-8:12"
 *
 * For any verse candidates that don't exist in `bible`, `lookupVerses` will simply skip them.
 */
function expandRef(ref: string): string[] {
  const trimmed = ref.trim();

  // 1) Full cross-chapter range: "Exodus 7:14-8:12"
  const fullRange = trimmed.match(/^(.+?)\s(\d+):(\d+)-(\d+):(\d+)$/);
  if (fullRange) {
    const [, book, startChapStr, startVerseStr, endChapStr, endVerseStr] =
      fullRange;
    const startChap = parseInt(startChapStr, 10);
    const startVerse = parseInt(startVerseStr, 10);
    const endChap = parseInt(endChapStr, 10);
    const endVerse = parseInt(endVerseStr, 10);

    if (
      Number.isNaN(startChap) ||
      Number.isNaN(startVerse) ||
      Number.isNaN(endChap) ||
      Number.isNaN(endVerse)
    ) {
      return [trimmed];
    }

    // If the range is "backwards", just treat it as a single verse.
    if (endChap < startChap || (endChap === startChap && endVerse < startVerse)) {
      return [`${book} ${startChap}:${startVerse}`];
    }

    const verses: string[] = [];
    for (let chap = startChap; chap <= endChap; chap++) {
      const from = chap === startChap ? startVerse : 1;
      const to = chap === endChap ? endVerse : MAX_VERSES_PER_CHAPTER;
      for (let v = from; v <= to; v++) {
        verses.push(`${book} ${chap}:${v}`);
      }
    }
    return verses;
  }

  // 2) Same-chapter range (order-insensitive):
  //    - "John 3:16-18"      → 16–18
  //    - "Exodus 7:14-12"    → 12–14 (swapped)
  const simpleRange = trimmed.match(/^(.+?)\s(\d+):(\d+)-(\d+)$/);
  if (simpleRange) {
    const [, book, chapStr, startStr, endStr] = simpleRange;
    const chap = parseInt(chapStr, 10);
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    if (Number.isNaN(chap) || Number.isNaN(start) || Number.isNaN(end)) {
      return [trimmed];
    }

    const verses: string[] = [];
    const from = Math.min(start, end);
    const to = Math.max(start, end);
    for (let v = from; v <= to; v++) {
      verses.push(`${book} ${chap}:${v}`);
    }

    return verses;
  }

  // 3) Single verse (or anything else we don't specially parse)
  return [trimmed];
}
/**
 * Normalizes a full reference like "Psalm 23:1" or "First John 3:16"
 * by replacing known alternate book names with the canonical form.
 */
function normalizeRef(ref: string): string {
  // Try longest match first by sorting alias keys by length descending
  for (const alias of Object.keys(BOOK_ALIASES).sort(
    (a, b) => b.length - a.length,
  )) {
    const regex = new RegExp(`^${alias}\\b`, "i");
    if (regex.test(ref)) {
      const canonical = BOOK_ALIASES[alias];
      return ref.replace(regex, canonical);
    }
  }
  return ref;
}

// export function lookupVerses(refs: string[]): BibleVerse[] {
//   const results: BibleVerse[] = [];
//   for (const ref of refs) {
//     const expanded = expandRef(ref);
//     for (const single of expanded) {
//       const text = bible[single];
//       if (text) {
//         results.push({ ref: single, text });
//       }
//     }
//   }
//   return results;
// }

export function lookupVerses(refs: string[]): BibleVerse[] {
  const results: BibleVerse[] = [];
  for (const ref of refs) {
    const expanded = expandRef(ref);
    for (const single of expanded) {
      const cleaned = cleanRef(single);
      const normalized = normalizeRef(cleaned);
      const text = bible[normalized];
      if (text) {
        results.push({ ref: normalized, text });
      }
    }
  }
  return results;
}
