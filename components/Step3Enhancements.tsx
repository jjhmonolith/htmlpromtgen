
import React, { useState, useEffect } from 'react';
import type { Step3Spec, Step2Spec, ProjectData, PageEnhancement } from '../types';

interface Step3EnhancementsProps {
  projectData: ProjectData;
  step2Spec: Step2Spec;
  initialSpec: Step3Spec | null;
  onUpdateSpec: (spec: Step3Spec) => void;
  onNext: (spec: Step3Spec) => void;
  onBack: () => void;
  isLoading: boolean;
}

const PageContent: React.FC<{
    pageId: string;
    index: number;
    pageEnhancement: PageEnhancement;
    layoutDescription: string;
    onSpecChange: (pageId: string, field: keyof PageEnhancement, value: string) => void;
    pageTopic: string;
}> = ({ pageId, index, pageEnhancement, layoutDescription, onSpecChange, pageTopic }) => (
    <div className="p-4 border border-slate-200 rounded-lg">
        <h3 className="font-bold text-slate-800 text-lg mb-4">📄 페이지 {index + 1}: {pageTopic}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-4 lg:mb-0">
                <p className="font-semibold text-slate-600 block mb-2 text-sm">최종 레이아웃:</p>
                <p className="text-xs text-slate-500 bg-white p-2 rounded max-h-48 overflow-y-auto">{layoutDescription}</p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="font-semibold text-slate-600 block mb-1">애니메이션 제안:</label>
                    <textarea value={pageEnhancement.animationDescription} onChange={e => onSpecChange(pageId, 'animationDescription', e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm" rows={4}/>
                </div>
                <div>
                    <label className="font-semibold text-slate-600 block mb-1">상호작용 제안:</label>
                    <textarea value={pageEnhancement.interactionDescription} onChange={e => onSpecChange(pageId, 'interactionDescription', e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm" rows={4}/>
                </div>
            </div>
        </div>
    </div>
);


const PageSkeleton: React.FC<{ index: number; pageTopic: string; }> = ({ index, pageTopic }) => (
    <div className="p-4 border border-slate-200 rounded-lg animate-pulse">
        <h3 className="font-bold text-slate-400 text-lg mb-4">📄 페이지 {index + 1}: {pageTopic}</h3>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
            <div className="bg-slate-200 rounded-md h-32 mb-4 lg:mb-0"></div>
            <div className="space-y-4">
                <div>
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-16 bg-slate-200 rounded"></div>
                </div>
                 <div>
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-16 bg-slate-200 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);

export const Step3Enhancements: React.FC<Step3EnhancementsProps> = ({ projectData, step2Spec, initialSpec, onUpdateSpec, onNext, onBack, isLoading }) => {
  const [spec, setSpec] = useState<Step3Spec | null>(initialSpec);

  useEffect(() => {
    setSpec(initialSpec);
  }, [initialSpec]);

  const handleSpecChange = (pageId: string, field: keyof Step3Spec[string], value: string) => {
    if (!spec) return;
    const newSpec = {
      ...spec,
      [pageId]: { ...spec[pageId], [field]: value },
    };
    setSpec(newSpec);
    onUpdateSpec(newSpec);
  };
  
  const allPagesLoaded = spec && Object.keys(spec).length === projectData.pages.length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">4/5 단계: 애니메이션 및 상호작용 추가</h2>
        <p className="text-slate-500 mt-1">AI가 제안한 애니메이션과 상호작용 효과를 검토하고 수정하세요.</p>
      </div>

      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4">
        {projectData.pages.map((page, index) => {
            const pageEnhancement = spec?.[page.id];
            if (pageEnhancement) {
                return (
                    <PageContent 
                        key={page.id}
                        pageId={page.id}
                        index={index}
                        pageEnhancement={pageEnhancement}
                        layoutDescription={step2Spec[page.id].layoutDescription}
                        onSpecChange={handleSpecChange}
                        pageTopic={page.topic || '제목 없는 페이지'}
                    />
                );
            }
            return (
                <PageSkeleton 
                    key={page.id}
                    index={index}
                    pageTopic={page.topic || '제목 없는 페이지'}
                />
            );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
        <button
          onClick={onBack}
          className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={() => onNext(spec!)}
          disabled={!allPagesLoaded || isLoading}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '생성 중...' : '다음: 최종 프롬프트 생성 →'}
        </button>
      </div>
    </div>
  );
};
