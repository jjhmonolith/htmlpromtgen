
import React, { useState, useMemo } from 'react';
import type { ProjectData, Step2Spec, Step3Spec, VisualIdentity } from '../types';
import { generateFinalPrompt } from '../constants';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { PencilIcon } from './icons/PencilIcon';
import { HomeIcon } from './icons/HomeIcon';

interface Step4PromptProps {
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  step2Spec: Step2Spec;
  step3Spec: Step3Spec;
  onBack: () => void;
  onStartOver: () => void;
}

export const Step4Prompt: React.FC<Step4PromptProps> = ({ projectData, visualIdentity, step2Spec, step3Spec, onBack, onStartOver }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const generatedPrompt = useMemo(() => 
    generateFinalPrompt(projectData, visualIdentity, step2Spec, step3Spec),
    [projectData, visualIdentity, step2Spec, step3Spec]
  );
  
  const [promptText, setPromptText] = useState(generatedPrompt);
  const [copySuccess, setCopySuccess] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopySuccess('클립보드에 복사되었습니다!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('복사에 실패했습니다.');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">5/5 단계: 최종 프롬프트</h2>
        <p className="text-slate-500 mt-1">프롬프트가 완성되었습니다! 복사하여 Google AI Studio 또는 다른 코드 생성기에 사용하세요.</p>
      </div>
      
      <div className="relative">
        <textarea
          readOnly={!isEditing}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className={`w-full h-96 p-4 font-mono text-sm bg-slate-900 text-slate-100 border rounded-lg resize-none focus:ring-2 ${isEditing ? 'border-blue-500 ring-blue-500' : 'border-slate-700'}`}
        />
        <div className="absolute top-3 right-3 flex space-x-2">
            {copySuccess ? (
                 <span className="text-sm text-green-600 bg-green-100 px-3 py-1.5 rounded-md transition-opacity duration-300">{copySuccess}</span>
            ) : (
                <button
                  onClick={handleCopy}
                  className="p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-600"
                  aria-label="프롬프트 복사"
                >
                  <ClipboardIcon />
                </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 border rounded-md transition-colors ${isEditing ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
              aria-label={isEditing ? '편집 완료' : '프롬프트 수정'}
            >
              <PencilIcon />
            </button>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
        <button
          onClick={onBack}
          className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
        >
          ← 이전
        </button>
         <button
          onClick={onStartOver}
          className="flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <HomeIcon />
          <span>처음부터 다시 시작</span>
        </button>
      </div>
    </div>
  );
};
