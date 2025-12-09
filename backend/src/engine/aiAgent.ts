import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { log } from "console";

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
   
    const prompt = PromptTemplate.fromTemplate(`
    
 You are a LaTeX resume parser.

You will be given the full LaTeX source of a resume in the placeholder LATEX_SOURCE below.

Your job:
1. Identify logical resume sections (for example: "Summary", "Experience", "Projects", "Skills", "Education", "Achievements").
2. For each section, extract the exact LaTeX code that belongs to that section.
3. Split that LaTeX code into individual lines.
4. also give others sections resume in separate list for example : usepackage , setlimit etc 

Output format (very important):
- Respond with ONLY valid JSON. No markdown, no backticks, no explanations.
- The top-level JSON object must have this shape:

{{
  "sections": [
    {{
      "title": "Summary",
      "latex_lines": [
        "... one line of LaTeX ...",
        "... another line of LaTeX ..."
      ]
    }}
  ]
}}

Rules for "latex_lines":
- Each element in "latex_lines" is exactly ONE line of LaTeX from the input.
- Do NOT put actual newline characters inside a string. Each line is a separate array element.
- Copy the LaTeX content exactly. Do not rewrite or reflow it.
- Preserve the order of lines and sections as in the original.

Rules for the overall response:
- Output must be valid JSON that can be parsed by JSON.parse in JavaScript.
- Do NOT include any text before or after the JSON.
- Do NOT wrap the JSON in \`\`\`json or any other fences.

LATEX_SOURCE:
{resume}
`);
    const chain = prompt.pipe(this.model);
    try {
      const result = (await chain.invoke({ resume }))
      console.log(result);
      return result;
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
