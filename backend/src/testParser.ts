// Simple manual test script
import { LatexProcessor } from './engine/latexProcessor.js';

const sampleLatex = `
\\documentclass{article}
\\begin{document}

\\section{Education}
BS Computer Science
University of Tech

\\section{Experience}
Software Engineer at Google.
- Built cool things.
- Fixed unexpected bugs.

\\section{Skills}
TypeScript, Python, React.

\\end{document}
`;

const processor = new LatexProcessor();
console.log("--- Parsing ---");
const sections = processor.parseSections(sampleLatex);
console.log(JSON.stringify(sections, null, 2));

console.log("\n--- Injecting ---");
const newSections = {
    "Experience": "Senior Software Engineer at Google.\n- Led a team of 10.\n- Architected specific solutions."
};
const updatedLatex = processor.injectContent(sampleLatex, newSections);
console.log(updatedLatex);
