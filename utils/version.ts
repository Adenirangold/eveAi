/**
 * Parses a semver string into [major, minor, patch] numbers.
 * Handles missing parts (e.g. "1" -> [1, 0, 0], "1.0" -> [1, 0, 0]).
 */
function parseVersion(ver: string): number[] {
  const parts = ver.replace(/[^0-9.]/g, "").split(".");
  return [
    parseInt(parts[0] || "0", 10),
    parseInt(parts[1] || "0", 10),
    parseInt(parts[2] || "0", 10),
  ];
}

/**
 * Returns true if current >= required (current meets or exceeds minimum required).
 */
export function isVersionGte(current: string, required: string): boolean {
  const [cMajor, cMinor, cPatch] = parseVersion(current);
  const [rMajor, rMinor, rPatch] = parseVersion(required);

  if (cMajor !== rMajor) return cMajor > rMajor;
  if (cMinor !== rMinor) return cMinor > rMinor;
  return cPatch >= rPatch;
}
