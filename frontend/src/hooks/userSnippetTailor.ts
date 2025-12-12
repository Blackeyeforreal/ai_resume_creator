import { useState } from 'react';
import { toast } from 'sonner'; // Assuming you added sonner as recommended

export function useSnippetTailor(jobDescription: string) {
  const [isTailoring, setIsTailoring] = useState(false);

  /**
   * Sends a specific snippet to the AI for tailoring
   * Returns the new text or null if failed.
   */
  const tailorSnippet = async (text: string): Promise<string | null> => {
    if (!jobDescription) {
      toast.error("Please add a Job Description first!");
      return null;
    }

    setIsTailoring(true);
    try {
      const response = await fetch('http://localhost:3000/tailor', { // Reusing your existing endpoint or a new one
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionName: "Selected Snippet", // Generic name for snippet mode
          currentContent: text,
          jdAnalysis: { raw_jd: jobDescription } // Passing raw JD or analysis if you have it
        })
      });
      
      const data = await response.json();
      
      if (data.content) {
        toast.success("AI optimization applied!");
        return data.content;
      }
      return null;

    } catch (error) {
      console.error("Tailor error:", error);
      toast.error("Failed to tailor selection.");
      return null;
    } finally {
      setIsTailoring(false);
    }
  };

  return { tailorSnippet, isTailoring };
}
