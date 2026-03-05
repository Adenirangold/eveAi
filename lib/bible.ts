import bibleData from "@/Bible.json";

const bible = bibleData as Record<string, string>;

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

export function lookupVerses(refs: string[]): BibleVerse[] {
  const results: BibleVerse[] = [];
  for (const ref of refs) {
    const expanded = expandRef(ref);
    for (const single of expanded) {
      const text = bible[single];
      if (text) {
        results.push({ ref: single, text });
      }
    }
  }
  return results;
}