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

export interface BibleVerse {
  ref: string;
  text: string;
}

/**
 * Expands a reference like "John 3:16-18" into ["John 3:16", "John 3:17", "John 3:18"].
 * Handles single verses ("John 3:16") and verse ranges within the same chapter.
 */
function expandRef(ref: string): string[] {
  const rangeMatch = ref.match(/^(.+\s\d+):(\d+)-(\d+)$/);
  if (rangeMatch) {
    const [, prefix, startStr, endStr] = rangeMatch;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    const refs: string[] = [];
    for (let v = start; v <= end; v++) {
      refs.push(`${prefix}:${v}`);
    }
    return refs;
  }
  return [ref.trim()];
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
