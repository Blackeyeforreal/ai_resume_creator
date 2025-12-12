import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { log } from "console";

import { fixInvalidBackslashes } from './util.js';

export class AIAgent {
  private model: Ollama;

  constructor() {
    this.model = new Ollama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2:latest",
      temperature: 0, // Lower temperature for deterministic tasks
    });
  }

  async parseLatext(resume: string) {
    // 1. Split lines deterministically in code first
    const lines = resume.split(/\r?\n/);
    const linesWithIndex = lines.map((line, index) => `${index}: ${line}`).join('\n');

    // 2. Simplified Prompt: Only ask for the PLAN, not the execution.
    const prompt = PromptTemplate.fromTemplate(`
You are a LaTeX parser assistant.
Your goal is to identify the line numbers where specific Resume Sections begin.

Input: A list of lines from a LaTeX file, numbered.
Output: A JSON object mapping Section Titles to their STARTING line number.

Rules:
1. Identify the "Preamble" (usually starts at line 0).
2. Identify major sections (e.g., "Experience", "Education", "Skills") by finding lines like \\section{{...}} or \\section*{{...}}.
3. The "Postamble" usually starts at \\end{{document}}.
4. Return ONLY valid JSON.

Example Input:
0: \\documentclass{{article}}
1: \\begin{{document}}
2: \\section{{Education}}
3: ...
10: \\section{{Skills}}

Example Output:
{{
  "sections": [
    {{ "title": "preamble", "start_line": 0 }},
    {{ "title": "Education", "start_line": 2 }},
    {{ "title": "Skills", "start_line": 10 }},
    {{ "title": "postamble", "start_line": 99 }}
  ]
}}

Now analyze this file:
{linesWithIndex}
`);

    const chain = prompt.pipe(this.model);

    try {
      // 3. Get the "Map" from the AI
      const response = await chain.invoke({linesWithIndex});
      
      // Clean and parse JSON
      const jsonString = response.slice(response.indexOf('{'), response.lastIndexOf('}') + 1);
      const plan = JSON.parse(jsonString);

      // 4. Execute the split deterministically in CODE (Level 2 Reliability)
      const sections = [];
      const sortedSections = plan.sections.sort((a: any, b: any) => a.start_line - b.start_line);

      for (let i = 0; i < sortedSections.length; i++) {
        const current = sortedSections[i];
        const next = sortedSections[i + 1];
        
        // Define range
        const start = current.start_line;
        const end = next ? next.start_line : lines.length; // Last section goes to end

        // Extract lines safely using original array
        const sectionLines = lines.slice(start, end);

        // Map to your desired structure
        if (current.title === 'preamble') {
          // Special handling if you want separate preamble field
           // or just push it as a section depending on your frontend logic
           // For now, let's match your interface roughly, or return it as part of result
        }

        sections.push({
          title: current.title,
          latex_lines: sectionLines
        });
      }

      // Filter out preamble/postamble to match your specific return type if needed
      // This is a rough mapping to your exact interface:
      
      const preambleObj = sections.find(s => s.title.toLowerCase() === 'preamble');
      const postambleObj = sections.find(s => s.title.toLowerCase() === 'postamble');
      const coreSections = sections.filter(s => s.title !== 'preamble' && s.title !== 'postamble');

      return {
        sections: coreSections,
        preamble_lines: preambleObj ? preambleObj.latex_lines : [],
        postamble_lines: postambleObj ? postambleObj.latex_lines : [],
      };

    } catch (error) {
      console.error("AI Analysis Failed:", error);
      // Fallback: Return everything as one section or error
      return { 
          sections: [{ title: "Full Document", latex_lines: lines }], 
          preamble_lines: [], 
          postamble_lines: [] 
      };
    }
  }



  async analyzeJobDescription(jdText: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an expert technical recruiter and resume strategist.
      Analyze the following Job Description (JD) and extract the top 5 technical skills, top 3 soft skills, and the core mission of the role.
      
      Job Description:
      {jdText}
      
      Output the analysis in a concise JSON format like:
      {{
        "tech_skills": ["Skill1", "Skill2"],
        "soft_skills": ["Skill1", "Skill2"],
        "mission": "Brief mission statement"
      }}
    `);

    const chain = prompt.pipe(this.model);
    try {
      const result = await chain.invoke({ jdText });
      console.log(result);
      return result as string;
    } catch (error) {
      console.error("AI Error:", error);
      return JSON.stringify({ error: "Failed to analyze JD. Ensure Ollama is running." });
    }
  }

  async tailorResumeSection(sectionName: string, currentContent: string, jdAnalysis: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a professional resume writer. Your goal is to rewrite the "{sectionName}" section of a resume to better align with a target job.

      Target Job Analysis:
      {jdAnalysis}

      Current Section Content (LaTeX format):
      {currentContent}

      Instructions:
      1. Keep the LaTeX formatting exactly as is (e.g., \\item, \\textbf).
      2. Rewrite bullet points to emphasize relevant skills from the JD.
      3. Use the STAR method (Situation, Task, Action, Result) if implied by the content.
      4. Do not invent false information, but highlight existing relevant experience.
      5. Output ONLY the valid LaTeX code for this section. Do not include markdown code blocks.

      Rewritten Section:
    `);

    const chain = prompt.pipe(this.model);
    try {
      const result = await chain.invoke({ sectionName, currentContent, jdAnalysis });
      return (result as string).replace(/```latex/g, '').replace(/```/g, '').trim();
    } catch (error) {
      console.error("AI Error:", error);
      return currentContent;
    }
  }
}
