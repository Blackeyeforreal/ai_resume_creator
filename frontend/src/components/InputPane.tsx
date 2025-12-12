import { Upload, ArrowRight, Wand2 } from 'lucide-react';

interface InputPaneProps {
  onFileUpload: (file: File) => void;
  jobDescription: string;
  setJobDescription: (val: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  selectedCount: number;
}

export function InputPane({ 
  onFileUpload, 
  jobDescription, 
  setJobDescription, 
  onAnalyze, 
  loading, 
  selectedCount 
}: InputPaneProps) {
  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-6">
      {/* Upload Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</div>
          Input Resume (LaTeX)
        </h2>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 transition hover:border-blue-400 hover:bg-blue-50/50 group text-center cursor-pointer relative">
          <input 
            type="file" 
            accept=".tex"
            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
            <Upload size={20} />
          </div>
          <p className="text-sm font-medium text-slate-700">Drag .tex file or click to upload</p>
        </div>
      </div>

      <div className="w-full h-px bg-slate-100" />

      {/* JD Section */}
      <div className="space-y-3 flex-1 flex flex-col">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</div>
          Job Description
        </h2>
        <textarea
          className="flex-1 w-full p-4 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        
        <button
          onClick={onAnalyze}
          disabled={loading || !jobDescription || selectedCount === 0}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Wand2 className="animate-spin" size={18} />
          ) : (
            <ArrowRight size={18} />
          )}
          {loading ? "Analyzing & Tailoring..." : `Optimize ${selectedCount} Selected Sections`}
        </button>
      </div>
    </div>
  );
}
