import { useState } from 'react'; // Import useState
import { CheckSquare, Square, FileText, Eye, Edit3 } from 'lucide-react'; // Import icons
import type { ResumeSection } from '../types';
import { DiffView } from './DiffView'; // Assuming you created this from the previous step

interface EditorPaneProps {
  sections: ResumeSection[];
  selectedSections: Set<string>;
  onToggleSection: (title: string) => void;
  onUpdateSection: (index: number, value: string) => void;
  loading: boolean;
}

export function EditorPane({
  sections,
  selectedSections,
  onToggleSection,
  onUpdateSection,
  loading
}: EditorPaneProps) {
  // Local state to track which sections are in "Diff Mode"
  const [diffModes, setDiffModes] = useState<Record<number, boolean>>({});

  const toggleDiffMode = (index: number) => {
    setDiffModes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-slate-200 bg-slate-50/50">
      {/* Header code remains the same... */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText size={16} />
          Sections Detected
        </h2>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">
          {sections.length} sections
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading/Empty states remain the same... */}
        
        {sections.map((section, index) => {
          const isDiffOpen = diffModes[index];
          const hasChanges = section.originalLatex && section.originalLatex !== section.latex;

          return (
            <div 
              key={index} 
              className={`bg-white border rounded-lg shadow-sm transition-all duration-200 ${
                selectedSections.has(section.title) ? 'ring-2 ring-blue-500/10 border-blue-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between p-3 border-b border-slate-50">
                {/* Checkbox and Title */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleSection(section.title)}
                    className="text-slate-400 hover:text-blue-500 transition"
                  >
                    {selectedSections.has(section.title) 
                      ? <CheckSquare size={18} className="text-blue-500" /> 
                      : <Square size={18} />
                    }
                  </button>
                  <span className="font-medium text-sm text-slate-700 capitalize">
                    {section.title}
                  </span>
                </div>

                {/* --- NEW: Diff Toggle Button --- */}
                {hasChanges && (
                  <button
                    onClick={() => toggleDiffMode(index)}
                    className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition hover:bg-slate-100 text-slate-500"
                    title={isDiffOpen ? "Back to Editor" : "See AI Changes"}
                  >
                    {isDiffOpen ? (
                      <>
                        <Edit3 size={14} /> Edit
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Compare
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-2">
                {/* --- CALL DIFF VIEW HERE --- */}
                {isDiffOpen && section.originalLatex ? (
                  <div className="max-h-96 overflow-y-auto border rounded bg-slate-50">
                    <DiffView 
                        original={section.originalLatex} 
                        modified={section.latex} 
                    />
                  </div>
                ) : (
                  <textarea
                    className="w-full text-xs font-mono bg-slate-50 p-3 rounded-md border-0 resize-y focus:ring-0 text-slate-600 leading-relaxed"
                    rows={6}
                    value={section.latex}
                    onChange={(e) => onUpdateSection(index, e.target.value)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
