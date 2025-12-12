import { Header } from './components/header';
import { InputPane } from './components/InputPane';
import { EditorPane } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { useResumeApp } from './hooks/userResumeApp';

function App() {
  const {
    jobDescription,
    setJobDescription,
    sections,
    selectedSections,
    loading,
    activeTab,
    setActiveTab,
    pdfUrl,
    pdfLoading,
    fullLatex,
    reconstructLatex,
    handleFileUpload,
    handleAnalyzeAndTailor,
    toggleSection,
    updateSectionLatex,
    retryPdf
  } = useResumeApp();

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 font-sans">
      <Header />
      
      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Pane 1: Inputs & JD (25%) */}
        <div className="col-span-3 border-r border-slate-200 bg-white h-full overflow-hidden">
          <InputPane
            onFileUpload={handleFileUpload}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            onAnalyze={handleAnalyzeAndTailor}
            loading={loading}
            selectedCount={selectedSections.size}
          />
        </div>

        {/* Pane 2: Editor (35%) */}
        <div className="col-span-4 h-full overflow-hidden">
          <EditorPane
            sections={sections}
            selectedSections={selectedSections}
            onToggleSection={toggleSection}
            onUpdateSection={updateSectionLatex}
            loading={loading}
          />
        </div>

        {/* Pane 3: Preview (40%) */}
        <div className="col-span-5 h-full overflow-hidden">
          <PreviewPane
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fullLatex={fullLatex}
            pdfUrl={pdfUrl}
            pdfLoading={pdfLoading}
            onRetryPdf={retryPdf}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
