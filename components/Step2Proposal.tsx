
import React, { useState, useEffect } from 'react';
import type { Step2Spec, ProjectData, PageProposal } from '../types';
import { SimpleHtmlPreview } from './SimpleHtmlPreview';

interface Step2ProposalProps {
  projectData: ProjectData;
  initialSpec: Step2Spec | null;
  onUpdateSpec: (spec: Step2Spec) => void;
  onNext: (spec: Step2Spec) => void;
  onBack: () => void;
  isLoading: boolean;
}

const PageContent: React.FC<{
    pageId: string;
    index: number;
    pageSpec: PageProposal;
    onSpecChange: (pageId: string, value: string) => void;
    pageTopic: string;
}> = ({ pageId, index, pageSpec, onSpecChange, pageTopic }) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    return (
        <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-bold text-slate-800 text-lg mb-2">📄 페이지 {index + 1}: {pageTopic}</h3>

            <div className="mb-4 border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'edit'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                        aria-current={activeTab === 'edit' ? 'page' : undefined}
                    >
                        설명 편집
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'preview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                        aria-current={activeTab === 'preview' ? 'page' : undefined}
                    >
                        간이 미리보기
                    </button>
                </nav>
            </div>

            {activeTab === 'edit' ? (
                <div className="space-y-4">
                    <div>
                        <label htmlFor={`layout-desc-${pageId}`} className="font-semibold text-slate-600 block mb-1">레이아웃 설명:</label>
                        <textarea 
                            id={`layout-desc-${pageId}`}
                            value={pageSpec.layoutDescription} 
                            onChange={e => onSpecChange(pageId, e.target.value)} 
                            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
                            rows={12}
                        />
                    </div>
                    {pageSpec.images && pageSpec.images.length > 0 && (
                        <div>
                            <p className="font-semibold text-slate-600 mb-2">이미지 기획:</p>
                            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2 text-sm">
                                {pageSpec.images.map(img => (
                                    <div key={img.filename} className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                                        <span className="font-mono text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-md mt-0.5">{img.filename}</span>
                                        <p className="text-slate-600">{img.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <SimpleHtmlPreview description={pageSpec.layoutDescription} />
            )}
        </div>
    );
};

const PageSkeleton: React.FC<{ index: number; pageTopic: string; }> = ({ index, pageTopic }) => (
    <div className="p-4 border border-slate-200 rounded-lg animate-pulse">
        <h3 className="font-bold text-slate-400 text-lg mb-4">📄 페이지 {index + 1}: {pageTopic}</h3>
        <div className="space-y-4">
            <div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-32 bg-slate-200 rounded"></div>
            </div>
            <div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-16 bg-slate-200 rounded"></div>
            </div>
        </div>
    </div>
);


export const Step2Proposal: React.FC<Step2ProposalProps> = ({ projectData, initialSpec, onUpdateSpec, onNext, onBack, isLoading }) => {
  const [spec, setSpec] = useState<Step2Spec | null>(initialSpec);

  useEffect(() => {
    setSpec(initialSpec);
  }, [initialSpec]);

  const handleSpecChange = (pageId: string, value: string) => {
    if (!spec) return;
    const newSpec = {
      ...spec,
      [pageId]: { ...spec[pageId], layoutDescription: value },
    };
    setSpec(newSpec);
    onUpdateSpec(newSpec);
  };
  
  const allPagesLoaded = spec && Object.keys(spec).length === projectData.pages.length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">3/5 단계: 레이아웃 제안</h2>
        <p className="text-slate-500 mt-1">AI가 제안한 레이아웃 구성안입니다. 필요에 따라 설명을 수정할 수 있습니다.</p>
      </div>

      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4">
        {projectData.pages.map((page, index) => {
          const pageSpec = spec?.[page.id];
          if (pageSpec) {
            return (
              <PageContent
                key={page.id}
                pageId={page.id}
                index={index}
                pageSpec={pageSpec}
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
          {isLoading ? '생성 중...' : '다음: 효과 추가 →'}
        </button>
      </div>
    </div>
  );
};
