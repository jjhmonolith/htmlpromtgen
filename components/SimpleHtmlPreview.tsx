
import React from 'react';

interface SimpleHtmlPreviewProps {
  description: string;
}

const parseDescriptionToElements = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return [<div key="empty" className="text-slate-400 text-center py-10">레이아웃 설명을 입력하면 미리보기가 여기에 표시됩니다.</div>];
  }

  const elements: JSX.Element[] = [];
  let inTwoColumnLayout = false;
  let column1Content: JSX.Element[] = [];
  let column2Content: JSX.Element[] = [];

  const renderColumns = () => {
    const rendered = (
      <div key={`col-layout-${elements.length}`} className="flex-grow flex gap-4">
        <div className="flex-1 bg-slate-100 border border-slate-200 p-2 rounded space-y-2 flex flex-col">{column1Content}</div>
        <div className="flex-1 bg-slate-100 border border-slate-200 p-2 rounded space-y-2 flex flex-col">{column2Content}</div>
      </div>
    );
    column1Content = [];
    column2Content = [];
    return rendered;
  };

  let currentColumn: 1 | 2 | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const [keyword, ...rest] = line.split(/: (.*)/s);
    const content = rest.join(': ').trim();

    const addElement = (el: JSX.Element) => {
        if (currentColumn === 1) {
            column1Content.push(el);
        } else if (currentColumn === 2) {
            column2Content.push(el);
        } else {
            elements.push(el);
        }
    }
    
    switch (keyword) {
      case 'TWO_COLUMN_LAYOUT_START':
        inTwoColumnLayout = true;
        break;
      case 'TWO_COLUMN_LAYOUT_END':
        if(inTwoColumnLayout) {
          elements.push(renderColumns());
          inTwoColumnLayout = false;
          currentColumn = null;
        }
        break;
      case 'COLUMN_1_START':
        if (inTwoColumnLayout) currentColumn = 1;
        break;
      case 'COLUMN_1_END':
        if (inTwoColumnLayout) currentColumn = null;
        break;
      case 'COLUMN_2_START':
        if (inTwoColumnLayout) currentColumn = 2;
        break;
      case 'COLUMN_2_END':
        if (inTwoColumnLayout) currentColumn = null;
        break;
      case 'HEADER':
        addElement(<div key={i} className="bg-blue-100 border border-blue-200 p-3 rounded-t-lg text-blue-800 font-semibold">{content}</div>);
        break;
      case 'TEXT':
        addElement(<div key={i} className="bg-white p-4 text-left text-sm text-slate-700">{content}</div>);
        break;
      case 'IMAGE':
        const [filename] = content.split('|');
        addElement(<div key={i} className="bg-purple-100 border-dashed border-2 border-purple-300 p-4 rounded text-purple-800 flex items-center justify-center min-h-[80px] text-xs text-center">🖼️<br/>{filename.trim()}</div>);
        break;
      case 'BUTTON':
        addElement(<div key={i} className="text-center py-2"><button className="bg-blue-500 text-white py-2 px-6 rounded-lg text-sm">{content}</button></div>);
        break;
      default:
        // Treat as plain text if no keyword matches
        addElement(<div key={i} className="bg-slate-200 border border-slate-300 p-4 rounded text-sm text-slate-600">{line}</div>);
        break;
    }
  }

  // If layout ends without explicit END tag, render remaining columns
  if (inTwoColumnLayout) {
      elements.push(renderColumns());
  }

  return elements;
};

export const SimpleHtmlPreview: React.FC<SimpleHtmlPreviewProps> = ({ description }) => {
  const elements = parseDescriptionToElements(description);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 h-full min-h-[300px] flex flex-col">
      {elements}
    </div>
  );
};
