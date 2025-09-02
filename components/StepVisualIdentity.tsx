
import React from 'react';
import type { VisualIdentity } from '../types';

interface StepVisualIdentityProps {
  visualIdentity: VisualIdentity | null;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const LoadingSkeleton: React.FC = () => (
    <div className="p-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
            ))}
        </div>
    </div>
);

const ColorSwatch: React.FC<{ color: string; name: string }> = ({ color, name }) => (
    <div className="flex flex-col items-center space-y-2">
        <div className="w-16 h-16 rounded-full border-4 border-white shadow" style={{ backgroundColor: color }}></div>
        <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{name}</p>
            <p className="text-xs text-slate-500 font-mono">{color}</p>
        </div>
    </div>
);

export const StepVisualIdentity: React.FC<StepVisualIdentityProps> = ({ visualIdentity, onNext, onBack, isLoading }) => {
  if (isLoading || !visualIdentity) {
    return <LoadingSkeleton />;
  }
  
  const { moodAndTone, colorPalette, typography, componentStyle } = visualIdentity;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">2/5 단계: 비주얼 아이덴티티</h2>
        <p className="text-slate-500 mt-1">AI가 프로젝트의 전반적인 디자인 컨셉을 정의했습니다.</p>
      </div>

      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4">
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="font-bold text-slate-800 text-lg mb-3">🎨 분위기 & 톤</h3>
            <p className="text-slate-600">{moodAndTone}</p>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-bold text-slate-800 text-lg mb-4">🎨 색상 팔레트</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 justify-items-center">
                <ColorSwatch color={colorPalette.primary} name="Primary" />
                <ColorSwatch color={colorPalette.secondary} name="Secondary" />
                <ColorSwatch color={colorPalette.accent} name="Accent" />
                <ColorSwatch color={colorPalette.text} name="Text" />
                <ColorSwatch color={colorPalette.background} name="Background" />
            </div>
        </div>
        
        <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-bold text-slate-800 text-lg mb-3">✒️ 타이포그래피</h3>
            <div className="space-y-2 text-slate-600">
                <p><span className="font-semibold text-slate-700">제목 폰트:</span> {typography.headingFont}</p>
                <p><span className="font-semibold text-slate-700">본문 폰트:</span> {typography.bodyFont}</p>
                <p><span className="font-semibold text-slate-700">기본 크기:</span> {typography.baseSize}</p>
            </div>
        </div>
        
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="font-bold text-slate-800 text-lg mb-3">📦 컴포넌트 스타일</h3>
            <p className="text-slate-600">{componentStyle}</p>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
        <button
          onClick={onBack}
          className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          다음: 레이아웃 제안 →
        </button>
      </div>
    </div>
  );
};
