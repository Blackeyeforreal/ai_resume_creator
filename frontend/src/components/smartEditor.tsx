import { useRef, useEffect } from 'react';
import  Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { Wand2 } from 'lucide-react';

interface SmartEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onTailorRequest: (selectedText: string, range: any) => void;
  isTailoring: boolean;
}

export function SmartEditor({ code, onChange, onTailorRequest, isTailoring }: SmartEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 1. Register the "Tailor" Action in the Context Menu
    editor.addAction({
      id: 'ai-tailor-selection',
      label: '✨ AI Tailor Selection',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: (ed) => {
        const selection = ed.getSelection();
        const model = ed.getModel();
        
        if (selection && model && !selection.isEmpty()) {
          const text = model.getValueInRange(selection);
          // Pass the text AND the range (so we know where to replace it later)
          onTailorRequest(text, selection);
        }
      }
    });
  };

  // Optional: Add a visual decoration if tailoring is in progress (Level 2 polish)
  useEffect(() => {
    // You could add a spinner or highlight here later
  }, [isTailoring]);

  return (
    <div className="relative h-full w-full bg-white">
      {/* Loading Overlay for the Editor */}
      {isTailoring && (
        <div className="absolute top-2 right-4 z-10 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Wand2 size={12} className="animate-spin" />
          Optimizing Selection...
        </div>
      )}

      <Editor
        height="100%"
        defaultLanguage="latex"
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          minimap: { enabled: false }, // Cleaner look
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          wordWrap: 'on',
          padding: { top: 20, bottom: 20 },
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          scrollBeyondLastLine: false,
          contextmenu: true, // Ensure right-click works
        }}
      />
    </div>
  );
}
