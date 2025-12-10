import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, ArrowRight, Wand2, CheckSquare, Square } from 'lucide-react'
import { cn } from './lib/utils'
// @ts-ignore
import { parse, HtmlGenerator } from 'latex.js'

interface ResumeSection {
  title: string;
  latex: string;
  // which macro/environment created the section
}
type Section = {
  title: string;
  latex_lines: string[];
};
function stripDocumentEnvironment(tex: string): string {
  return tex
    // .replace(/\\begin\s*\{\s*document\s*\}/gi, "")
    // .replace(/\\end\s*\{\s*document\s*\}/gi, "");
}

function normalizeLatexForPreview(tex: string): string {
  return tex.replace(/\\n\s*/g, "\n");
}
function sanitizeLatexForPreview(tex: string): string {
  let cleaned = tex;

  // 1. Convert literal "\n" markers to real newlines
  cleaned = cleaned.replace(/\\n\s*/g, "\n");

  // 2. Remove/neutralize \hfill (latex.js doesn't know it; we just use a space)
  cleaned = cleaned.replace(/\\hfill\b/g, " ");

  // 3. Simplify itemize options: \begin{itemize}[leftmargin=1.5em] -> \begin{itemize}
  cleaned = cleaned.replace(
    /\\begin\{itemize\}\s*\[[^\]]*]/g,
    "\\begin{itemize}"
  );

  // 4. (Optional) If you ever get duplicate sections like \section and \section* with same title:
  cleaned = cleaned.replace(
    /\\section\{([^}]*)\}\s*\\section\*\{\1\}/g,
    "\\section*{$1}"
  );

  return cleaned;
}


function extractDocumentBody(tex: string): string {
  const beginTag = "\\begin{document}";
  const endTag = "\\end{document}";

  const beginIdx = tex.indexOf(beginTag);
  const endIdx = tex.indexOf(endTag);

  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    return tex.slice(beginIdx + beginTag.length, endIdx).trim();
  }

  // If there is no explicit document env, just return as-is
  return tex;
}


function App() {
  const [latexContent, setLatexContent] = useState<string>('')
  const [jobDescription, setJobDescription] = useState<string>('')
  const [sections, setSections] = useState<ResumeSection[]>([])
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const previewRef = useRef<HTMLDivElement>(null)
  const [preamble, setPreamble] = useState<string>('');
  const [postamble, setPostamble] = useState<string>('');

  
  useEffect(() => {
    if (activeTab === 'preview' && previewRef.current) {
      renderPreview();
    }
  }, [activeTab, sections])

  const renderPreview = () => {
    if (!previewRef.current) return;
    try {
      const fullLatex = reconstructLatex();
      let body = stripDocumentEnvironment(fullLatex);

    // 3. Fix literal "\n" artifacts from LLM / JSON
     body = sanitizeLatexForPreview(body);
console.log(body)
      // const bodyLatex = extractDocumentBody(fullLatex)
      // const sanitizedLatex = sanitizeLatexForPreview(fullLatex)
      // console.log(sanitizedLatex)
      const generator = new HtmlGenerator({ hyphenate: false });
      const doc = parse(body, { generator: generator });

      previewRef.current.innerHTML = '';
      previewRef.current.appendChild(doc.domFragment());
    } catch (error) {
      console.error("Preview render failed:", error);
      previewRef.current.innerHTML = '<div class="text-red-500 p-4">Preview Error: ' + (error as any).message + '</div>';
    }
  }

  const reconstructLatex = () => {
    //const preamble = sections.find(s => s.title === 'preamble')?.latex || '';
    const body = sections
      .filter(s => s.title !== 'preamble')
      .map(s => `\\section{${s.title}}\n${s.latex}`)
      .join('\n\n');

    return `${preamble}\n\\begin{document}\n${body}\n\\end{document}`;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setLatexContent(text)

    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: text })
      })

      const data = await response.json()
      const rawSections: Section[] = data.sections;
      const preamble = data.preamble_lines.join("\n");
      const postamble = data.postamble_lines.join("\n");
      setPreamble(preamble)
      setPostamble(postamble)
      const reconstructed = rawSections.map((s) => ({
        title: s.title,
        latex: s.latex_lines.join("\n"),
      }));

      setSections(reconstructed)
      // Select all by default except preamble
      const newSelected = new Set(reconstructed.filter(s => s.title !== 'preamble').map(s => s.title));
      setSelectedSections(newSelected);

      setLoading(false)
      event.target.value = ''
    } catch (error) {
      console.error("Parsing failed", error)
      setLoading(false)
    }
  }

  const toggleSection = (title: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(title)) {
      newSelected.delete(title);
    } else {
      newSelected.add(title);
    }
    setSelectedSections(newSelected);
  }

  const handleAnalyzeAndTailor = async () => {
    if (!jobDescription || sections.length === 0) return
    setLoading(true)

    try {
      // 1. Analyze JD
      const analyzeRes = await fetch('http://localhost:3000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: jobDescription })
      })
      const analysis = await analyzeRes.json()

      // 2. Tailor SELECTED sections
      const sectionsToTailor = sections.filter(s => selectedSections.has(s.title));

      for (const section of sectionsToTailor) {
        const tailorRes = await fetch('http://localhost:3000/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionName: section.title,
            currentContent: section.latex,
            jdAnalysis: analysis
          })
        })
        const tailorData = await tailorRes.json()

        // Update state immediately for feedback
        setSections(prev => prev.map(sec =>
          sec.title === section.title
            ? { ...sec, latex: tailorData.content }
            : sec
        ))
      }

    } catch (error) {
      console.error("AI Operations failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-2 text-blue-400">
          <Wand2 className="w-5 h-5" />
          <span className="font-bold tracking-tight">AI Resume Engineer</span>
        </div>
        <div className="text-xs text-slate-500">v1.1.0 Interactive</div>
      </header>

      {/* Main Content - 3 Panes */}
      <main className="flex-1 flex overflow-hidden">

        {/* Pane 1: Inputs & JD */}
        <div className="w-1/3 border-r border-slate-800 p-6 flex flex-col gap-6 bg-slate-900/20">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">1. Input Resume (LaTeX)</h2>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:border-slate-500 hover:bg-slate-800/50 transition cursor-pointer relative group">
              <FileText className="w-8 h-8 mb-2 group-hover:text-blue-400 transition" />
              <span className="text-sm">Drag .tex file or click to upload</span>
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".tex" />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">2. Job Description</h2>
            <textarea
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleAnalyzeAndTailor}
            disabled={loading || selectedSections.size === 0}
            className={cn(
              "h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition all",
              (loading || selectedSections.size === 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? <Wand2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Analyzing & Tailoring..." : `Optimize ${selectedSections.size} Selected Sections`}
          </button>
        </div>

        {/* Pane 2: Editor / Sections */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/10">
          <div className="h-10 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/30">
            <span className="text-sm font-medium text-slate-300">Sections Detected</span>
            <span className="text-xs text-slate-500">{sections.length} sections</span>
          </div>
          {loading && sections.length === 0 && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-center text-slate-600 mt-20 italic">Processing...</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sections.length === 0 ? (
              <div className="text-center text-slate-600 mt-20 italic">No sections parsed yet.</div>
            ) : (
              sections.map((section, index) => (
                <div key={section.title || index} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="text-slate-400 hover:text-blue-400 transition"
                        title={selectedSections.has(section.title) ? "Unselect for optimization" : "Select for optimization"}
                      >
                        {selectedSections.has(section.title)
                          ? <CheckSquare className="w-4 h-4 text-blue-500" />
                          : <Square className="w-4 h-4" />
                        }
                      </button>
                      <span className={cn(
                        "text-xs font-bold uppercase px-2 py-1 rounded transition",
                        selectedSections.has(section.title) ? "bg-blue-400/10 text-blue-400" : "bg-slate-800 text-slate-500"
                      )}>
                        {section.title}
                      </span>
                    </div>
                  </div>
                  <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-300 focus:border-blue-500 focus:outline-none scrollbar-thin scrollbar-thumb-slate-700 transition"
                    value={section.latex}
                    onChange={(e) => {
                      setSections(prev => prev.map((sec, i) =>
                        i === index ? { ...sec, latex: e.target.value } : sec
                      ))
                    }}
                  />
                </div>
              ))
            )}
          </div>

        </div>

        {/* Pane 3: Preview */}
        <div className="w-1/3 flex flex-col bg-slate-950">
          <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/30 gap-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={cn("text-xs font-medium h-full border-b-2 px-2 transition", activeTab === 'editor' ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300")}
            >
              Source Code
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={cn("text-xs font-medium h-full border-b-2 px-2 transition", activeTab === 'preview' ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300")}
            >
              Web Preview
            </button>
          </div>
          <div className="flex-1 p-4 bg-slate-900/50 overflow-auto">
            {activeTab === 'editor' ? (
              <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                {reconstructLatex()}
              </pre>
            ) : (
              <div
                ref={previewRef}
                className="w-full h-full bg-white text-black p-8 overflow-auto shadow-lg resume-preview"
              >
                {/* Content will be injected here by latex.js */}
                <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
                  <Wand2 className="w-8 h-8 opacity-20 animate-pulse" />
                  <p className='text-xs'>Rendering Preview...</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

export default App
