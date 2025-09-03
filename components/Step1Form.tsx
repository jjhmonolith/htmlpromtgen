
import React, { useState } from 'react';
import type { ProjectData, PageInfo } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { generateCurriculumPlan, analyzeContentVolume } from '../services/openaiService';

interface Step1FormProps {
  initialData: ProjectData;
  onNext: (data: ProjectData) => void;
  isProcessing: boolean;
}

// Component for displaying content analysis results
const ContentAnalysisCard: React.FC<{
  page: PageInfo;
  onSplit: (pageId: string) => void;
  isAnalyzing: boolean;
}> = ({ page, onSplit, isAnalyzing }) => {
  const analysis = page.contentAnalysis;
  
  if (!analysis) {
    return null;
  }

  const getDensityColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getDensityText = (score: number) => {
    if (score >= 0.8) return '⚠️ 내용이 너무 많음';
    if (score >= 0.6) return '📊 적정 분량';
    return '✅ 여유 있음';
  };

  return (
    <div className={`mt-3 p-3 rounded-lg border ${getDensityColor(analysis.densityScore)}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold">{getDensityText(analysis.densityScore)}</span>
        {analysis.suggestedSplit?.shouldSplit && (
          <button
            onClick={() => onSplit(page.id)}
            disabled={isAnalyzing}
            className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors disabled:bg-gray-400"
          >
            📄 {analysis.suggestedSplit.splitInto}개로 분할
          </button>
        )}
      </div>
      <div className="text-sm space-y-1">
        <p className="font-medium">예상 구성:</p>
        <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
          {analysis.outline.map((item, idx) => (
            <li key={idx} className="line-clamp-1">{item}</li>
          ))}
        </ul>
        <p className="text-xs mt-2 opacity-75">
          예상 섹션 수: {analysis.estimatedSections}개
        </p>
      </div>
    </div>
  );
};

export const Step1Form: React.FC<Step1FormProps> = ({ initialData, onNext, isProcessing }) => {
  const [projectTitle, setProjectTitle] = useState(initialData.projectTitle);
  const [targetAudience, setTargetAudience] = useState(initialData.targetAudience);
  const [pages, setPages] = useState<PageInfo[]>(initialData.pages);
  const [suggestions, setSuggestions] = useState(initialData.suggestions || '');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  // State for AI curriculum generation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleAddPage = () => {
    if (pages.length >= 10) return;
    const newPage: PageInfo = { id: Date.now().toString(), topic: '' };
    setPages([...pages, newPage]);
    setHasAnalyzed(false); // Reset analysis when pages change
  };

  const handleRemovePage = (id: string) => {
    if (pages.length <= 1) return;
    setPages(pages.filter(page => page.id !== id));
    setHasAnalyzed(false); // Reset analysis when pages change
  };

  const handlePageTopicChange = (id: string, topic: string) => {
    setPages(pages.map(page => (page.id === id ? { ...page, topic } : page)));
    setHasAnalyzed(false); // Reset analysis when content changes
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("파일 크기가 너무 큽니다. 5MB 미만의 이미지를 선택해주세요.");
        return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert("지원하지 않는 파일 형식입니다. PNG, JPEG, WEBP 이미지를 선택해주세요.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPages(pages.map(page => 
            page.id === id ? { ...page, image: { filename: file.name, mimeType: file.type, data: base64String } } : page
        ));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (id: string) => {
    setPages(pages.map(page => {
        if (page.id === id) {
            const { image, ...rest } = page;
            return rest;
        }
        return page;
    }));
  };
  
  // New function to analyze content volume
  const handleAnalyzeContent = async () => {
    if (!projectTitle || !targetAudience || pages.some(p => !p.topic)) {
      setError('분량 검토를 위해 모든 필수 항목을 먼저 입력해주세요.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const analyzedPages = await analyzeContentVolume({
        projectTitle,
        targetAudience,
        pages,
        suggestions
      });
      
      setPages(analyzedPages);
      setHasAnalyzed(true);
    } catch (err) {
      console.error('Content analysis failed:', err);
      setError('분량 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // New function to handle page splitting
  const handleSplitPage = (pageId: string) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const page = pages[pageIndex];
    
    if (!page || !page.contentAnalysis?.suggestedSplit) return;
    
    const { splitSuggestions } = page.contentAnalysis.suggestedSplit;
    
    // Create new pages based on split suggestions
    const newPages = [...pages];
    const splitPages = splitSuggestions.map((suggestion, idx) => ({
      id: `${pageId}-split-${idx}`,
      topic: suggestion.topic,
      contentAnalysis: {
        outline: suggestion.outline,
        estimatedSections: Math.ceil(suggestion.outline.length / 2),
        densityScore: 0.5, // Assume balanced after split
      }
    }));
    
    // Replace original page with split pages
    newPages.splice(pageIndex, 1, ...splitPages);
    setPages(newPages);
  };
  
  const handleTestMode = () => {
    setProjectTitle('AI 리터러시 첫걸음');
    setTargetAudience('AI에 대해 처음 배우는 중학생');
    setPages([
      { id: 'test-1', topic: "'생각하는 기계' AI, 궁금하지 않니? - 학생들의 호기심을 유발하는 질문으로 시작하기" },
      { id: 'test-2', topic: "AI는 우리를 돕는 '똑똑한 컴퓨터 프로그램'이야 - AI의 핵심 개념을 쉬운 비유로 설명하기" },
      { id: 'test-3', topic: "우리 주변의 AI 친구들 찾아보기! - 스마트폰 음성 비서, 유튜브 추천 등 일상 속 사례 제시" },
      { id: 'test-4', topic: "AI는 어떻게 똑똑해질까? '데이터' 먹고 쑥쑥! - '머신러닝'의 기본 원리를 고양이 사진 예시로 설명" },
      { id: 'test-5', topic: "오늘 배운 AI 개념 퀴즈! - 간단한 O/X 퀴즈로 학습 내용 확인하며 마무리" },
    ]);
    setSuggestions('중학생 눈높이에 맞춰 친근한 말투와 귀여운 아이콘을 사용해주세요. 전체적으로 밝고 긍정적인 느낌을 원해요.');
    setHasAnalyzed(false); // Reset analysis for test mode
  };

  const handleGeneratePlan = async () => {
    if (!modalInput) return;
    setIsGenerating(true);
    setModalError('');
    try {
        const plan = await generateCurriculumPlan(modalInput);
        setProjectTitle(plan.projectTitle);
        setTargetAudience(plan.targetAudience);
        setPages(plan.pages.map((p, index) => ({
            id: `gen-${Date.now()}-${index}`,
            topic: p.topic,
        })));
        setSuggestions(''); // Reset suggestions
        setIsModalOpen(false);
        setModalInput('');
        setHasAnalyzed(false); // Reset analysis for generated plan
    } catch (err) {
        console.error("Failed to generate curriculum plan:", err);
        setModalError('계획 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!projectTitle || !targetAudience || pages.some(p => !p.topic)) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }
    setError('');
    onNext({ projectTitle, targetAudience, pages, suggestions });
  };
  
  const totalPages = pages.length;

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">1/5 단계: 기본 정보 입력</h2>
          <p className="text-slate-500 mt-1">제작할 교육 콘텐츠에 대한 기본 정보를 알려주세요.</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 text-sm transition-colors flex items-center space-x-2"
            >
              <SparklesIcon />
              <span>딸깍</span>
            </button>
            <button
              onClick={handleTestMode}
              className="bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 text-sm transition-colors"
            >
              🧪 테스트 모드
            </button>
        </div>
      </div>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6">{error}</div>}

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="projectTitle" className="block text-sm font-medium text-slate-700 mb-1">프로젝트 제목</label>
            <input
              type="text"
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="예: 인공지능 시작하기"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700 mb-1">대상 학습자</label>
            <input
              type="text"
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="예: 중학생"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-medium text-slate-700">페이지별 주제 ({totalPages}/10)</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAnalyzeContent}
                disabled={isAnalyzing || !projectTitle || !targetAudience || pages.some(p => !p.topic)}
                className={`flex items-center space-x-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  hasAnalyzed 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                } disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>분석 중...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>{hasAnalyzed ? '재검토' : '분량 검토'}</span>
                  </>
                )}
              </button>
              <button
                onClick={handleAddPage}
                disabled={pages.length >= 10}
                className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <PlusIcon />
                <span>페이지 추가</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pages.map((page, index) => (
              <div key={page.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-600">페이지 {index + 1}</p>
                  <button
                    onClick={() => handleRemovePage(page.id)}
                    disabled={pages.length <= 1}
                    className="p-1 text-slate-400 hover:text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                    aria-label={`페이지 ${index + 1} 제거`}
                  >
                    <TrashIcon />
                  </button>
                </div>
                
                <textarea
                  id={`page-${page.id}`}
                  value={page.topic}
                  onChange={(e) => handlePageTopicChange(page.id, e.target.value)}
                  placeholder={`페이지 ${index + 1} 주제`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />

                {/* Content Analysis Results */}
                <ContentAnalysisCard 
                  page={page} 
                  onSplit={handleSplitPage}
                  isAnalyzing={isAnalyzing}
                />

                {page.image ? (
                  <div className="space-y-2">
                    <img src={`data:${page.image.mimeType};base64,${page.image.data}`} alt="참고 이미지 미리보기" className="w-full h-32 object-cover rounded-md border border-slate-200"/>
                    <div className="flex items-center justify-between text-sm bg-slate-200 p-2 rounded-md">
                      <div className="flex items-center space-x-2 text-slate-600 truncate">
                        <FileIcon />
                        <span className="truncate" title={page.image.filename}>{page.image.filename}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveImage(page.id)}
                        className="p-1 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 flex-shrink-0"
                        aria-label={`페이지 ${index+1} 이미지 제거`}
                      >
                         <TrashIcon />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor={`file-${page.id}`} className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-md p-4 text-center h-full">
                      <UploadIcon />
                      <span>참고 이미지 업로드 (선택 사항)</span>
                      <input
                          id={`file-${page.id}`}
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={(e) => handleFileChange(page.id, e.target.files ? e.target.files[0] : null)}
                      />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="suggestions" className="block text-sm font-medium text-slate-700 mb-1">전체적인 제안 (선택 사항)</label>
          <textarea
            id="suggestions"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="예: 파란색과 금색을 주로 사용해주세요. 전반적으로 재미있고 격려하는 분위기를 원해요."
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">AI로 교안 자동 구성하기</h3>
            <p className="text-slate-500 mb-4 text-sm">만들고 싶은 교육 내용의 주제와 대상을 간단히 입력해주세요. AI가 전체 목차를 자동으로 생성해 드립니다.</p>
            {modalError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{modalError}</div>}
            <textarea
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder="예: 중학생을 위한 AI 윤리 교육"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              disabled={isGenerating}
            />
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isGenerating}
                className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating || !modalInput}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-wait"
              >
                {isGenerating ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-wait transition-colors"
        >
          {isProcessing ? '생성 중...' : '다음: 비주얼 아이덴티티 →'}
        </button>
      </div>
    </div>
  );
};
