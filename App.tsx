
import React, { useState, useCallback, useEffect } from 'react';
import { Step1Form } from './components/Step1Form';
import { StepVisualIdentity } from './components/StepVisualIdentity';
import { Step2Proposal } from './components/Step2Proposal';
import { Step3Enhancements } from './components/Step3Enhancements';
import { Step4Prompt } from './components/Step4Prompt';
import { ProjectSelector } from './components/ProjectSelector';
import { useAutoSave } from './hooks/useAutoSave';
import type { ProjectData, VisualIdentity, Step2Spec, Step3Spec, PageProposal, PageEnhancement, SavedProject } from './types';
import { Step } from './types';
import { generateVisualIdentity, generateInitialProposals, generateEnhancementSuggestions } from './services/openaiService';
import { storageService } from './services/storageService';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.BasicInfo);
  const [projectData, setProjectData] = useState<ProjectData>({
    projectTitle: '',
    targetAudience: '',
    pages: [{ id: '1', topic: '' }],
    suggestions: '',
  });
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity | null>(null);
  const [step2Spec, setStep2Spec] = useState<Step2Spec | null>(null);
  const [step3Spec, setStep3Spec] = useState<Step3Spec | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-save hook
  const { saveManually } = useAutoSave({
    projectId: currentProjectId,
    projectData,
    currentStep,
    visualIdentity,
    step2Spec,
    step3Spec,
    onSaveStatusChange: setSaveStatus,
  });

  // Load current project on mount or create new one
  useEffect(() => {
    const currentProject = storageService.getCurrentProject();
    if (currentProject) {
      loadProject(currentProject);
    } else {
      // Create a default project if none exists
      const newProject = storageService.createProject({
        projectTitle: '',
        targetAudience: '',
        pages: [{ id: '1', topic: '' }],
        suggestions: '',
      });
      setCurrentProjectId(newProject.id);
    }
  }, []);


  // Load a saved project
  const loadProject = (project: SavedProject) => {
    setCurrentProjectId(project.id);
    setProjectData(project.data.projectData);
    setCurrentStep(project.currentStep);
    setVisualIdentity(project.data.visualIdentity || null);
    setStep2Spec(project.data.step2Spec || null);
    setStep3Spec(project.data.step3Spec || null);
    storageService.setCurrentProjectId(project.id);
    setShowProjectSelector(false);
  };

  // Start new project with title
  const startNewProject = (title: string) => {
    // Save current project before creating new one
    if (currentProjectId) {
      saveManually();
    }
    
    const newProject = storageService.createProject({
      projectTitle: title,
      targetAudience: '',
      pages: [{ id: '1', topic: '' }],
      suggestions: '',
    });
    setCurrentProjectId(newProject.id);
    setProjectData(newProject.data.projectData);
    setCurrentStep(Step.BasicInfo);
    setVisualIdentity(null);
    setStep2Spec(null);
    setStep3Spec(null);
    setShowProjectSelector(false);
  };

  const handleNextStep1 = async (data: ProjectData) => {
    setProjectData(data);
    setCurrentStep(Step.VisualIdentity);
    setIsLoading(true);
    setError(null);
    
    // Auto-save before proceeding
    if (currentProjectId) {
      storageService.updateProject(currentProjectId, {
        projectData: data,
        currentStep: Step.VisualIdentity,
      });
    }
    
    try {
      const identity = await generateVisualIdentity(data);
      setVisualIdentity(identity);
      
      // Save after successful generation
      if (currentProjectId) {
        storageService.updateProject(currentProjectId, {
          visualIdentity: identity,
        });
      }
    } catch (err) {
      setError('비주얼 아이덴티티 생성에 실패했습니다. 다시 시도해 주세요.');
      console.error(err);
      setCurrentStep(Step.BasicInfo); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep2 = async () => {
    if (!visualIdentity) return;
    
    // 이미 step2Spec이 있고 모든 페이지가 로드되었으면 바로 다음 단계로
    if (step2Spec && Object.keys(step2Spec).length === projectData.pages.length) {
      setCurrentStep(Step.PageProposal);
      return;
    }
    
    setCurrentStep(Step.PageProposal);
    setStep2Spec({});
    setIsLoading(true);
    setError(null);
    try {
      await generateInitialProposals(projectData, visualIdentity, (pageId: string, proposal: PageProposal) => {
        setStep2Spec(prev => ({ ...prev, [pageId]: proposal }));
      });
    } catch (err) {
      setError('페이지 제안 생성에 실패했습니다. 다시 시도해 주세요.');
      console.error(err);
      setCurrentStep(Step.VisualIdentity);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep3 = async (spec: Step2Spec) => {
    if (!visualIdentity) return;
    setStep2Spec(spec);
    
    // Save step2 spec
    if (currentProjectId) {
      storageService.updateProject(currentProjectId, {
        step2Spec: spec,
        currentStep: Step.Enhancements,
      });
    }
    
    // 이미 step3Spec이 있고 모든 페이지가 로드되었으면 바로 다음 단계로
    if (step3Spec && Object.keys(step3Spec).length === projectData.pages.length) {
      setCurrentStep(Step.Enhancements);
      return;
    }
    
    setCurrentStep(Step.Enhancements);
    setStep3Spec({});
    setIsLoading(true);
    setError(null);
    try {
        const newStep3Spec: Step3Spec = {};
        await generateEnhancementSuggestions(spec, projectData, visualIdentity, (pageId: string, enhancement: PageEnhancement) => {
          newStep3Spec[pageId] = enhancement;
          setStep3Spec(prev => ({ ...prev, [pageId]: enhancement }));
        });
        
        // Save step3 spec after generation
        if (currentProjectId) {
          storageService.updateProject(currentProjectId, {
            step3Spec: newStep3Spec,
          });
        }
    } catch (err) {
        setError('개선 사항 생성에 실패했습니다. 다시 시도해 주세요.');
        console.error(err);
        setCurrentStep(Step.PageProposal);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleNextStep4 = (spec: Step3Spec) => {
    setStep3Spec(spec);
    setCurrentStep(Step.FinalPrompt);
    
    // Save step3 spec and update step
    if (currentProjectId) {
      storageService.updateProject(currentProjectId, {
        step3Spec: spec,
        currentStep: Step.FinalPrompt,
      });
    }
  };

  const handlePreviousStep = () => {
    // 이전 단계로 이동할 때 기존 데이터는 유지 (null로 설정하지 않음)
    // 이렇게 하면 이전 단계에서 다시 다음으로 갈 때 버튼이 활성화됨
    setCurrentStep(prev => (prev > Step.BasicInfo ? prev - 1 : Step.BasicInfo));
  };
  
  const handleStartOver = () => {
    // Create a new project
    const newProject = storageService.createProject({
      projectTitle: '',
      targetAudience: '',
      pages: [{ id: '1', topic: '' }],
      suggestions: '',
    });
    
    setCurrentProjectId(newProject.id);
    setProjectData(newProject.data.projectData);
    setVisualIdentity(null);
    setStep2Spec(null);
    setStep3Spec(null);
    setCurrentStep(Step.BasicInfo);
    setError(null);
    setIsLoading(false);
  };

  const updateStep2Spec = useCallback((newSpec: Step2Spec) => {
    setStep2Spec(newSpec);
  }, []);
  
  const updateStep3Spec = useCallback((newSpec: Step3Spec) => {
    setStep3Spec(newSpec);
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case Step.BasicInfo:
        return (
          <Step1Form 
            initialData={projectData} 
            onNext={handleNextStep1}
            isProcessing={isLoading} 
          />
        );
      case Step.VisualIdentity:
        return (
          <StepVisualIdentity
            visualIdentity={visualIdentity}
            onNext={handleNextStep2}
            onBack={handlePreviousStep}
            isLoading={isLoading}
          />
        );
      case Step.PageProposal:
        return (
          <Step2Proposal
            projectData={projectData}
            initialSpec={step2Spec}
            onUpdateSpec={updateStep2Spec}
            onNext={handleNextStep3}
            onBack={handlePreviousStep}
            isLoading={isLoading}
          />
        );
      case Step.Enhancements:
        return (
          <Step3Enhancements
            projectData={projectData}
            step2Spec={step2Spec!}
            initialSpec={step3Spec}
            onUpdateSpec={updateStep3Spec}
            onNext={handleNextStep4}
            onBack={handlePreviousStep}
            isLoading={isLoading}
          />
        );
      case Step.FinalPrompt:
        return (
          <Step4Prompt
            projectData={projectData}
            visualIdentity={visualIdentity!}
            step2Spec={step2Spec!}
            step3Spec={step3Spec!}
            onBack={handlePreviousStep}
            onStartOver={handleStartOver}
          />
        );
      default:
        return <div>잘못된 단계</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Project Selector Modal */}
      {showProjectSelector && (
        <ProjectSelector
          onProjectSelect={loadProject}
          onNewProject={startNewProject}
          currentProjectId={currentProjectId}
        />
      )}
      
      {/* Save Status Indicator */}
      <div className="fixed top-4 left-4 z-40">
        <div className={`px-3 py-2 rounded-lg shadow-sm transition-all ${
          saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
          saveStatus === 'saved' ? 'bg-green-100 text-green-800' :
          saveStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-white text-gray-600 border border-gray-200'
        }`}>
          {saveStatus === 'saving' && '💾 저장 중...'}
          {saveStatus === 'saved' && '✅ 저장됨'}
          {saveStatus === 'error' && '❌ 저장 실패'}
          {saveStatus === 'idle' && (
            <>
              {currentProjectId && projectData.projectTitle ? (
                <span className="text-sm">📝 {projectData.projectTitle}</span>
              ) : (
                <span className="text-sm">📝 새 프로젝트</span>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Project Menu Button */}
      <ProjectSelector
        onProjectSelect={loadProject}
        onNewProject={startNewProject}
        currentProjectId={currentProjectId}
      />
      
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">EduContent 프롬프트 생성기</h1>
          <p className="text-slate-500 mt-2">AI와 함께 5단계로 스크롤 없는 맞춤형 교육 콘텐츠를 만들어 보세요.</p>
          {currentProjectId && projectData.projectTitle && (
            <p className="text-sm text-slate-600 mt-2 font-medium">
              현재 프로젝트: {projectData.projectTitle}
            </p>
          )}
        </header>
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">오류: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        <main className="bg-white rounded-xl shadow-2xl shadow-slate-200">
          {renderStep()}
        </main>
        <footer className="text-center mt-8 text-slate-400 text-sm">
            <p>React, Tailwind CSS, Google Gemini 기반</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
