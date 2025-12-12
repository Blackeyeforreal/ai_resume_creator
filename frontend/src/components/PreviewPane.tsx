import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils'; // Assuming you have this
import type { ActiveTab } from '../types';

// @ts-ignore
import { parse, HtmlGenerator } from 'latex.js';

interface PreviewPaneProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  fullLatex: string;
  pdfUrl: string | null;
  pdfLoading: boolean;
  onRetryPdf: () => void;
}

export function PreviewPane({
  activeTab,
  setActiveTab,
  fullLatex,
  pdfUrl,
  pdfLoading,
  onRetryPdf
}: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle Web Preview Rendering
  // useEffect(() => {
  //   if (activeTab === 'preview' && previewRef.current) {
  //     try {
  //       const body = fullLatex.replace(/\\n\s*/g, "\n");
  //       const generator = new HtmlGenerator({ hyphenate: false });
  //       const doc = parse(body, { generator: generator });
        
  //       previewRef.current.innerHTML = '';
  //       previewRef.current.appendChild(doc.domFragment());
  //     } catch (error: any) {
  //       console.error("Preview render failed:", error);
  //       previewRef.current.innerHTML = `<div class="p-4 text-red-500 text-sm">Preview Error: ${error.message}</div>`;
  //     }
  //   }
  // }, [activeTab, fullLatex]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="h-10 border-b border-slate-200 bg-white flex items-center px-2 gap-1">
        {(['editor', 'preview', 'pdf'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "text-xs font-medium h-full border-b-2 px-4 transition capitalize",
              activeTab === tab 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab === 'editor' ? 'Source' : tab === 'preview' ? 'Web Preview' : 'PDF Preview'}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-auto relative">
        {activeTab === 'editor' && (
          <pre className="p-4 text-xs font-mono text-slate-600 whitespace-pre-wrap">
            {fullLatex}
          </pre>
        )}

        {activeTab === 'preview' && (
           <div className="p-8 bg-white min-h-full shadow-sm max-w-4xl mx-auto my-4" ref={previewRef}>
             <div className="text-slate-400 text-sm">Rendering Preview...</div>
           </div>
        )}

        {activeTab === 'pdf' && (
          <div className="h-full w-full flex flex-col items-center justify-center">
            {pdfLoading ? (
               <div className="text-sm text-slate-500 animate-pulse">Compiling PDF with Tectonic...</div>
            ) : pdfUrl ? (
               <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" />
            ) : (
               <div className="text-center">
                 <p className="text-sm text-slate-500 mb-2">Unable to load PDF.</p>
                 <button onClick={onRetryPdf} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
                   Retry
                 </button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
