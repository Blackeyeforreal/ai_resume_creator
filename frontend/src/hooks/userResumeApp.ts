import { useState, useEffect, useCallback } from 'react';
import type { ResumeSection, ActiveTab } from '../types';

export function useResumeApp() {
  const [latexContent, setLatexContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [fullLatex, setFullLatex] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  
  // Hidden state for latex structure
  const [preamble, setPreamble] = useState('');
  const [postamble, setPostamble] = useState('');


  
//   // --- Derived State Logic ---
//   const reconstructLatex = useCallback(() => {
//     console.log("Reconstructing LaTeX...");
//     const body = sections
//       .filter(s => s.title !== 'preamble')
//       .map(s => `\n${s.latex}`)
//       .join('\n\n');
//     const latex = `${preamble}\\begin{document}\n${body}\n\\end{document}\n${postamble}`;
// setFullLatex(latex);
//     return latex;
//   }, [sections, preamble, postamble]);

// const reconstructLatex = useCallback((sectionsArg?: typeof sections) => {
//   const src = sectionsArg ?? sections; // use passed-in sections or fallback to hook state
//   console.log("Reconstructing LaTeX...");
//   const body = src
//     .filter(s => s.title !== "preamble")
//     .map(s => `\n${s.latex}`)
//     .join("\n\n");

//   const latex = `${preamble}\\begin{document}\n${body}\n\\end{document}\n${postamble}`;
//   setFullLatex(latex);

//   if ( fullLatex === latex) console.log("Latex is updated ")
//    ;
//   return latex;
// }, [sections, preamble, postamble]);

const reconstructLatex = ((sectionsToUse: typeof sections) => {
  // Use passed sections. If null/undefined, fallback to state 'sections'
  const src = sectionsToUse 
  console.log(src)

  const body = src
    .filter(s => s.title !== "preamble")
    .map(s => `\n${s.latex}`)
    .join("\n\n");


  let latex = `${preamble}\\\n${body}\n\\\n${postamble}`;
  latex = latex.replace(/\\n/g, "");
  console.log("Reconstructed LaTeX:", latex);
  setFullLatex(latex);
  return latex;
});


  // --- API Handlers ---
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const text = await file.text();
    setLatexContent(text);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: text })
      });
      const data = await response.json();
      
      const rawSections = data.sections.map((s: any) => ({
        title: s.title,
        latex: s.latex_lines.join("\n"),
      }));
console.log(data.preamble_lines)
      setPreamble(data.preamble_lines.join("\n"));
      setPostamble(data.postamble_lines.join("\n"));
      setSections(rawSections);

      // Select all by default except preamble
      const newSelected = new Set<string>(
        rawSections.filter((s: ResumeSection) => s.title !== 'preamble').map((s: ResumeSection) => s.title)
      );
      setSelectedSections(newSelected);
    } catch (error) {
      console.error("Parsing failed", error);
    } finally {
      setLoading(false);
    }
  };

 const handleAnalyzeAndTailor = async () => {
    if (!jobDescription || sections.length === 0) return;
    setLoading(true);

    try {
      // 1. Analyze JD
      const analyzeRes = await fetch('http://localhost:3000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: jobDescription })
      });
      const analysis = await analyzeRes.json();

      // 2. Tailor SELECTED sections
      const sectionsToTailor = sections.filter(s => selectedSections.has(s.title));
      
      // ✅ Create a local mutable copy to track changes across iterations
      let currentSections = [...sections]; 
      
      for (const section of sectionsToTailor) {
        const tailorRes = await fetch('http://localhost:3000/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionName: section.title,
            currentContent: section.latex,
            jdAnalysis: analysis
          })
        });
        const tailorData = await tailorRes.json();

        // ✅ Update the LOCAL variable, not the stale state 'sections'
        currentSections = currentSections.map(s => 
          s.title === section.title ? { ...s,  originalLatex: s.latex, // <--- SAVE CURRENT STATE AS ORIGINAL
        latex: tailorData.content // <--- OVERWRITE WITH AI CONTENT
       } : s
        );

        console.log("Updated local sections:", currentSections);
        
        // Update React state to reflect progress on screen
        setSections(currentSections);

        // Reconstruct using the latest local data
        reconstructLatex(currentSections);
        
        // Invalidate PDF
        setPdfUrl(null);
      }
    } catch (error) {
      console.error("AI Operations failed", error);
    } finally {
      setLoading(false);
    }
};

  const generatePdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      console.log("generatePdf fullLatex", fullLatex)
      // setFullLatex();
      const response = await fetch('http://localhost:3000/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: fullLatex })
      });

      if (!response.ok) throw new Error("Compilation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      console.log(url)
      setPdfUrl(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setPdfLoading(false);
    }
  }, [fullLatex]);

  // --- Interaction Handlers ---
  const toggleSection = (title: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(title)) newSelected.delete(title);
    else newSelected.add(title);
    setSelectedSections(newSelected);
  };

const updateSectionLatex = (index: number, value: string) => {
  // produce the new array right away
  const newSections = sections.map((sec, i) =>
    i === index ? { ...sec, latex: value } : sec
  );

  setSections(newSections);
  console.log("Updated value:", value);
  console.log("Updated sections (newSections):", sections);

  // call reconstructLatex with the new data (preferred)
  
 const newLatex =   reconstructLatex(newSections);
  

  // setFullLatex(newLatex);
  setPdfUrl(null);
};
  // --- Effects ---
  useEffect(() => {
    if (activeTab === 'pdf' && !pdfUrl) {
      generatePdf();
    }
  }, [activeTab, pdfUrl, generatePdf]);

  return {
    // State
    jobDescription,
    setJobDescription,
    sections,
    selectedSections,
    loading,
    activeTab,
    setActiveTab,
    pdfUrl,
    pdfLoading,
    fullLatex,
    reconstructLatex,
    
    // Actions
    handleFileUpload,
    handleAnalyzeAndTailor,
    toggleSection,
    updateSectionLatex,
    retryPdf: generatePdf
  };
}
