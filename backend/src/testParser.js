"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple manual test script
var latexProcessor_js_1 = require("./engine/latexProcessor.js");
var sampleLatex = "\n\\documentclass{article}\n\\begin{document}\n\n\\section{Education}\nBS Computer Science\nUniversity of Tech\n\n\\section{Experience}\nSoftware Engineer at Google.\n- Built cool things.\n- Fixed unexpected bugs.\n\n\\section{Skills}\nTypeScript, Python, React.\n\n\\end{document}\n";
var processor = new latexProcessor_js_1.LatexProcessor();
console.log("--- Parsing ---");
var sections = processor.parseSections(sampleLatex);
console.log(JSON.stringify(sections, null, 2));
console.log("\n--- Injecting ---");
var newSections = {
    "Experience": "Senior Software Engineer at Google.\n- Led a team of 10.\n- Architected specific solutions."
};
var updatedLatex = processor.injectContent(sampleLatex, newSections);
console.log(updatedLatex);
