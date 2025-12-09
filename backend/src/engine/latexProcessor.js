"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LatexProcessor = void 0;
var LatexProcessor = /** @class */ (function () {
    function LatexProcessor() {
    }
    /**
     * Parses the LaTeX content to identify sections.
     * Dictionary keys are section names (e.g., "Experience"), values are the LaTeX content of that section.
     */
    LatexProcessor.prototype.parseSections = function (latexContent) {
        var sections = {};
        var sectionRegex = /\\section\{([^}]+)\}/g;
        var match;
        var lastIndex = 0;
        var lastSectionTitle = "preamble";
        while ((match = sectionRegex.exec(latexContent)) !== null) {
            var content = latexContent.substring(lastIndex, match.index).trim();
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
    };
    /**
     * Injects new content into the original LaTeX string.
     */
    LatexProcessor.prototype.injectContent = function (originalLatex, newSections) {
        var modifiedLatex = originalLatex;
        for (var _i = 0, _a = Object.entries(newSections); _i < _a.length; _i++) {
            var _b = _a[_i], sectionTitle = _b[0], newContent = _b[1];
            if (sectionTitle === 'preamble')
                continue;
            var startRegex = new RegExp("\\\\section\\{".concat(sectionTitle, "\\}"), 'g');
            var startMatch = startRegex.exec(modifiedLatex);
            if (!startMatch)
                continue;
            var contentStartIndex = startMatch.index + startMatch[0].length;
            var nextSectionRegex = /\\section\{[^}]+\}/g;
            nextSectionRegex.lastIndex = contentStartIndex;
            var nextMatch = nextSectionRegex.exec(modifiedLatex);
            var contentEndIndex = nextMatch ? nextMatch.index : modifiedLatex.length;
            modifiedLatex =
                modifiedLatex.substring(0, contentStartIndex) +
                    "\n" + newContent + "\n" +
                    modifiedLatex.substring(contentEndIndex);
        }
        return modifiedLatex;
    };
    return LatexProcessor;
}());
exports.LatexProcessor = LatexProcessor;
