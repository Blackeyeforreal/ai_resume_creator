const VALID_JSON_ESCAPES = new Set([
  '"', "\\", "/", "b", "f", "n", "r", "t", "u",
]);

export function fixInvalidBackslashes(jsonLike: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  let quoteChar: '"' | "'" | null = null;

  for (let i = 0; i < jsonLike.length; i++) {
    const ch = jsonLike[i];

    if (!inString) {
      // Outside strings: just track when we enter one
      if (ch === '"' || ch === "'") {
        inString = true;
        quoteChar = ch as '"' | "'";
      }
      out += ch;
      continue;
    }

    // Inside a string
    if (escape) {
      // Previous char was a backslash and we've already accepted it,
      // so just take this char as-is.
      out += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      const next = jsonLike[i + 1];

      if (!next) {
        // Backslash at end of string -> escape it
        out += "\\\\";
      } else if (!VALID_JSON_ESCAPES.has(next)) {
        // Invalid JSON escape -> make it \\ + next
        out += "\\\\";
      } else {
        // Valid escape start: keep as single \ and mark escape
        out += "\\";
        escape = true;
      }
      continue;
    }

    if (ch === quoteChar) {
      inString = false;
      quoteChar = null;
      out += ch;
      continue;
    }

    out += ch;
  }

  return out;
}
