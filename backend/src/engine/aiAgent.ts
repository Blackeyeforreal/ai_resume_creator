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
      temperature: 0.2,
    });
  }

  async parseLatext( resume : string  ){
    interface ResuresmeSection {
    title: string;
    latex_lines: string[];
}
interface result {
    sections: ResuresmeSection[];
    preamble_lines: string[];
    postamble_lines: string[];
}

   
    const prompt = PromptTemplate.fromTemplate(`
You are a LaTeX resume parser.

You will be given the full LaTeX source of a resume in the placeholder LATEX_SOURCE below .

Your tasks:
1. Identify logical resume sections (for example: "Summary", "Experience", "Projects", "Skills", "Education", "Achievements", etc.).
2. Split the LaTeX into three parts:
    - "sections": an ordered list of sections. Each section object must include the section title and an array "latex_lines" with the exact lines that belong to that section.
     * The section's first latex line MUST be the section header itself
    (for example: "\\section{{X}}" or "\\section*{{X}}" or any custom command line that serves as the header).
     Do NOT omit or move the header line into preamble or postamble.
   

VERY IMPORTANT: Preserve every single line of the input. There must be NO DATA LOSS.

Output format (very strict):
- Respond with ONLY valid JSON. No markdown, no backticks, no explanations.
- The top-level JSON object must have this exact shape (note: double braces are shown for template safety; your output must be plain JSON):

{{

  "sections": [
    {{
      "title": "Summary",
      "latex_lines": [ "...", "..." ]
    }}
  ],
  
}}

MANDATORY RULES (read carefully):
- **Line granularity**: Each element in any *_lines array must be exactly ONE input line from the original source. Do NOT join multiple original lines into one element. Do NOT split an original line across multiple elements.
- **Exact content**: Copy each line exactly as it appears in the input (preserve characters and order). Do NOT rewrite, normalize, or reflow content.
- **Whitespace**: Preserve leading and trailing spaces of each line verbatim. (So the parser must not trim lines.)
- **Backslashes**: Because this will be returned as JSON, every LaTeX backslash "\\" in the JSON must be escaped as "\\" so the JSON is valid. Example (how one input line must appear in JSON): the LaTeX line \\section*{{Summary}} must appear in JSON as "\\section*{{Summary}}".
- **Sections**: The section header line (e.g. \\section{{...}} or \\section*{{...}} or any custom header command line) must be included as the first element of the  latex_lines for that section. If the file has both \\section{{X}} and \\section*{{X}} in succession, preserve both lines in order (do NOT deduplicate unless identical and intentional).

- **Completeness / Reconstruction requirement**: If you concatenate the arrays in order with \\n between lines:
the reconstructedstring must be exactly the original input (byte-for-byte identical after normalizing line endings to LF). Do not omit any line or change any character.
- **No extra text**: Output must contain only the JSON object, nothing else. Do not include commentary, diagnostics, or notes.
- **If uncertain, keep the line**: When in doubt about whether a line belongs to the preamble, a section, or the postamble, include it where it logically fits **but do not drop it**. Better to include a doubtful line in the preamble than to lose it.


Now the input. Remember: do NOT add anything before or after your JSON.

LATEX_SOURCE:
 {resume}

`);
    const chain = prompt.pipe(this.model);
    try {
      let result = (await chain.invoke({resume}))
      //preable and postable from result 
      console.log(result);
      console.log(",-------------------------?")
      result = fixInvalidBackslashes(result.slice(result.indexOf('{') , result.lastIndexOf('}') + 1) );
      console.log(result);
      const jsonParsed = JSON.parse(result);
      
      jsonParsed.preamble_lines = resume.split(jsonParsed.sections[0].latex_lines)[0];
      jsonParsed.postamble_lines = resume.split(jsonParsed.sections[jsonParsed.sections.length - 1].latex_lines)[1];
      
      return jsonParsed;
    } catch (error) {
      console.error("AI Error:", error);
      return JSON.stringify({ error: "Failed to analyze resume. Ensure Ollama is running." });
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
