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
    
You are an expert technical recruiter and resume strategist.
Analyze the following resume and extract the sections WITHOUT modifying any LaTeX.

Resume:
{resume}

Output the analysis in this JSON format only no pre text:

{{
  "sections": [
    {{
      "section_name": "Section1",
      "section_content": "Exact LaTeX for Section1"
    }},
    {{
      "section_name": "Section2",
      "section_content": "Exact LaTeX for Section2"
    }}
  ]
}}

NOTE:
- Do NOT give any pre text.
- DO NOT modify LaTeX.
- DO NOT remove or add anything inside LaTeX code.
- Only group into sections.
`);
    const chain = prompt.pipe(this.model);
    try {
      const result = (await chain.invoke({ resume }));
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
