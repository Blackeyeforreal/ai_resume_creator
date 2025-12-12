import { Wand2 } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 border-b bg-white flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 font-semibold text-lg text-slate-800">
        <div className="bg-blue-600 text-white p-1.5 rounded-md">
          <Wand2 size={18} />
        </div>
        ResumeAI <span className="text-slate-400 font-normal">Editor</span>
      </div>
    </header>
  );
}
