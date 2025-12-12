import { diffWords } from 'diff';

export function DiffView({ original, modified }: { original: string; modified: string }) {
  const differences = diffWords(original, modified);

  return (
    <div className="p-3 bg-slate-50 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed">
      {differences.map((part, index) => {
        const color = part.added ? 'bg-green-100 text-green-800' :
                      part.removed ? 'bg-red-100 text-red-800 line-through decoration-red-500' : 
                      'text-slate-600';
        return <span key={index} className={color}>{part.value}</span>;
      })}
    </div>
  );
}
