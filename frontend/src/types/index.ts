export interface ResumeSection {
  title: string;
  latex: string;
  originalLatex : string;
}

export type ActiveTab = 'editor' | 'preview' | 'pdf' ;

export interface JDAnalysis {
  // Define specific fields if known, otherwise typical generic structure
  [key: string]: any;
}
