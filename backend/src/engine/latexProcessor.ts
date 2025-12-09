export class LatexProcessor {
    /**
     * Parses the LaTeX content to identify sections.
     * Dictionary keys are section names (e.g., "Experience"), values are the LaTeX content of that section.
     */
    parseSections(latexContent: string): Record<string, string> {
        const sections: Record<string, string> = {};

        const sectionRegex = /\\section\{([^}]+)\}/g;

        let match;
        let lastIndex = 0;
        let lastSectionTitle = "preamble";

        while ((match = sectionRegex.exec(latexContent)) !== null) {
            const content = latexContent.substring(lastIndex, match.index).trim();

            if (content.length > 0) {
                sections[lastSectionTitle] = content;
            }

            lastSectionTitle = match[1];
            lastIndex = sectionRegex.lastIndex;
        }

        if (lastIndex < latexContent.length) {
            sections[lastSectionTitle] = latexContent.substring(lastIndex).trim();
        }

        return sections;
    }

    /**
     * Injects new content into the original LaTeX string.
     */
    injectContent(originalLatex: string, newSections: Record<string, string>): string {
        let modifiedLatex = originalLatex;

        for (const [sectionTitle, newContent] of Object.entries(newSections)) {
            if (sectionTitle === 'preamble') continue;

            const startRegex = new RegExp(`\\\\section\\{${sectionTitle}\\}`, 'g');
            const startMatch = startRegex.exec(modifiedLatex);

            if (!startMatch) continue;

            const contentStartIndex = startMatch.index + startMatch[0].length;

            const nextSectionRegex = /\\section\{[^}]+\}/g;
            nextSectionRegex.lastIndex = contentStartIndex;
            const nextMatch = nextSectionRegex.exec(modifiedLatex);

            const contentEndIndex = nextMatch ? nextMatch.index : modifiedLatex.length;

            modifiedLatex =
                modifiedLatex.substring(0, contentStartIndex) +
                "\n" + newContent + "\n" +
                modifiedLatex.substring(contentEndIndex);
        }

        return modifiedLatex;
    }
}
