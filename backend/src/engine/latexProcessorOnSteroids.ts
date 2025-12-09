export interface LatexSection {
  title: string;
  latex: string;
  command: string;    // which macro/environment created the section
}

// Commands we *know* are NOT section headers
const IGNORE_COMMANDS = new Set([
  "item",
  "textbf",
  "textit",
  "href",
  "includegraphics",
  "footnote",
  "emph",
  "small",
  "normalsize",
  "large",
  "usepackage"
  // add more if you see false positives
]);

// Single regex that catches:
//   \cmd{Title}
//   \cmd*{Title}
//   \cmd[opts]{Title}
//   \begin{env}{Title}
const HEADER_REGEX =
  /^\\(?:(begin)\{([A-Za-z@]+)\}|([A-Za-z@]+)\*?)(?:\[[^\]]*\])?\{([^}\n]*)\}/gm;
/*
Groups:
- 1: "begin" if it's a \begin{env}{Title}
- 2: env name if it's \begin{env}{Title}
- 3: command name if it's \cmd{Title}
- 4: the {Title} text
*/

export function splitLatexIntoSections(tex: string): LatexSection[] {
  const matches: {
    index: number;
    title: string;
    command: string;
  }[] = [];

  let m: RegExpExecArray | null;
  while ((m = HEADER_REGEX.exec(tex)) !== null) {
    const isBeginEnv = !!m[1];
    const envName = m[2];
    const cmdName = m[3];
    const title = (m[4] || "").trim();

    const command = isBeginEnv ? envName : cmdName;
    if (!command) continue;

    // Ignore obvious non-section commands
    if (IGNORE_COMMANDS.has(command)) continue;

    // Heuristics: skip weird titles
    if (!title) continue;
    if (title.length > 80) continue;         // too long to be a section title
    if (title.includes("\\")) continue;      // contains LaTeX commands → likely not a plain title

    matches.push({
      index: m.index,
      title,
      command,
    });
  }

  if (matches.length === 0) {
    // No headers detected, fallback
    return [{ title: "FULL_DOCUMENT", latex: tex, command: "document" }];
  }

  const sections: LatexSection[] = [];

  for (let i = 0; i < matches.length; i++) {
    const { index, title, command } = matches[i];
    const start = index;
    const end = i + 1 < matches.length ? matches[i + 1].index : tex.length;

    const chunk = tex.slice(start, end).trim();

    sections.push({
      title,
      latex: chunk,
      command,
    });
  }

  return sections;
}
