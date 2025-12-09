import { useState } from 'react'
import { Upload, FileText, ArrowRight, Wand2, Smartphone } from 'lucide-react'
import { cn } from './lib/utils'

interface ResumeSection {
  title: string;
  latex: string;
     // which macro/environment created the section
}
type Section = {
  title: string;
  latex_lines: string[];
};


function App() {
  const [latexContent, setLatexContent] = useState<string>('')
  const [jobDescription, setJobDescription] = useState<string>('')
  const [sections, setSections] = useState<ResumeSection[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setLatexContent(text)

    // Parse immediately
    console.log("method called")
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: text })
      })

      const data = await response.json()

      const sections: Section[] = data.sections;

      const reconstructed = sections.map((s) => ({
        title: s.title,
        latex: s.latex_lines.join("\n"),
      }));
      console.log(reconstructed)
      setSections(reconstructed) // Correctly accessing the array from the response object
      setLoading(false)
      event.target.value = ''
    } catch (error) {
      console.error("Parsing failed", error)
    }
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

      // 2. Tailor valid sections (e.g., Experience)
      // For demo, we just tailor "Experience" if it exists
      const experienceSection = sections.find(s => s.title === 'Experience');
      if (experienceSection) {
        const tailorRes = await fetch('http://localhost:3000/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionName: 'Experience',
            currentContent: experienceSection.latex,
            jdAnalysis: analysis
          })
        })
        const tailorData = await tailorRes.json()

        // Update state with new content
        setSections(prev => prev.map(sec =>
          sec.title === 'Experience'
            ? { ...sec, latex: tailorData.content }
            : sec
        ))

        // In a real app, we would reconstruct the full latex string here
        console.log("Tailored Experience:", tailorData.content)
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
        <div className="text-xs text-slate-500">v1.0.0 Local Agent</div>
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
            disabled={loading}
            className={cn(
              "h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition all",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? <Wand2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Analyzing & Tailoring..." : "Optimize Resume"}
          </button>
        </div>

        {/* Pane 2: Editor / Sections */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/10">
          <div className="h-10 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/30">
            <span className="text-sm font-medium text-slate-300">Sections Detected</span>
          </div>
          {loading && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-center text-slate-600 mt-20 italic">Analyzing & Tailoring...</div>
            </div>
          )}
          {!loading && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sections.length === 0 ? (
                <div className="text-center text-slate-600 mt-20 italic">No sections parsed yet.</div>
              ) : (
                sections.map((section, index) => (
                  <div key={section.title || index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase bg-blue-400/10 px-2 py-1 rounded">{section.title}</span>
                    </div>
                    <textarea
                      className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-300 focus:border-blue-500 focus:outline-none scrollbar-thin scrollbar-thumb-slate-700"
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
          )}
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
              PDF Preview
            </button>
          </div>
          <div className="flex-1 p-4 bg-slate-900/50 overflow-auto">
            {activeTab === 'editor' ? (
              <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                {/* Reconstruct full latex for display */}
                {sections.find(s => s.title === 'preamble')?.latex || ''}
                {'\n\n'}
                {sections
                  .filter(s => s.title !== 'preamble')
                  .map(s => `\\section{${s.title}}\n${s.latex}`)
                  .join('\n\n')
                }
                {'\n\n\\end{document}'}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
                <Smartphone className="w-8 h-8 opacity-20" />
                <p>PDF compilation not connected to live preview yet.</p>
                <p className="text-xs opacity-50">Requires local pdflatex or standard template.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

export default App
