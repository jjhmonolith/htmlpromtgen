
import { GoogleGenAI, Type } from "@google/genai";
import type { ProjectData, Step2Spec, PageProposal, PageEnhancement, GeneratedPlan, VisualIdentity } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

// Utility function to add delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateVisualIdentity(projectData: ProjectData): Promise<VisualIdentity> {
    const prompt = `
당신은 프로젝트의 전체적인 비주얼 컨셉을 잡는 아트 디렉터입니다. 사용자가 제공한 프로젝트 개요를 바탕으로, 프로젝트의 '비주얼 아이덴티티'를 정의해주세요.

### 📜 프로젝트 개요
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **사용자 추가 제안**: ${projectData.suggestions || '없음'}

### 📋 생성할 항목
1.  **Mood & Tone**: 프로젝트의 전반적인 분위기를 설명하는 핵심 키워드 3-4개를 제시해주세요. (예: "활기찬, 재미있는, 다채로운, 친근한")
2.  **Color Palette**: 분위기에 맞는 색상 팔레트를 HEX 코드로 제안해주세요. (primary, secondary, accent, text, background)
3.  **Typography**: 제목과 본문에 어울리는 폰트 패밀리와 기본 사이즈를 제안해주세요. (headingFont, bodyFont, baseSize)
4.  **Component Style**: 버튼, 카드 등 UI 요소의 전반적인 스타일을 간결하게 설명해주세요. (예: "버튼은 모서리가 둥글고, 카드에는 약간의 그림자 효과를 적용합니다.")

### 💻 출력 형식
반드시 아래에 명시된 JSON 스키마에 맞춰 결과를 출력해야 합니다.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            moodAndTone: { type: Type.STRING },
            colorPalette: {
                type: Type.OBJECT,
                properties: {
                    primary: { type: Type.STRING },
                    secondary: { type: Type.STRING },
                    accent: { type: Type.STRING },
                    text: { type: Type.STRING },
                    background: { type: Type.STRING },
                },
                required: ['primary', 'secondary', 'accent', 'text', 'background'],
            },
            typography: {
                type: Type.OBJECT,
                properties: {
                    headingFont: { type: Type.STRING },
                    bodyFont: { type: Type.STRING },
                    baseSize: { type: Type.STRING },
                },
                required: ['headingFont', 'bodyFont', 'baseSize'],
            },
            componentStyle: { type: Type.STRING },
        },
        required: ['moodAndTone', 'colorPalette', 'typography', 'componentStyle'],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    return JSON.parse(response.text.trim()) as VisualIdentity;
}

export async function generateInitialProposals(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    onProgress: (pageId: string, proposal: PageProposal) => void
): Promise<void> {
    const suggestionsText = projectData.suggestions
        ? `\n- 사용자 추가 제안사항: ${projectData.suggestions}`
        : '';
    
    const layoutPrompt = `당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 스크롤 없는 1600x1000px 화면에 들어갈 콘텐츠 레이아웃을 **자유롭게, 상세하게, 창의적으로 서술**해주세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentity.moodAndTone}
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 흐르도록 유도하고, 콘텐츠를 단순히 박스에 넣는 것이 아니라 콘텐츠 자체의 형태에 맞는 맞춤형 디자인을 하세요.

### 📜 핵심 규칙
1.  **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요. (예: "화면 상단에는 큰 제목을 배치하고, 그 아래에 이미지를 왼쪽에, 설명을 오른쪽에 두는 2단 레이아웃을 구성합니다...")
2.  **공간 최적화**: 콘텐츠를 화면에 효과적으로 배치하여 어색한 빈 공간이 생기지 않도록 하세요.
3.  **이미지 최소화**: 학습에 필수적인 이미지만 사용하고, 장식용 이미지는 피하세요.
4.  **상세한 이미지 프롬프트**: 이미지 계획이 있다면, \`[IMAGE: 파일경로 | AI 이미지 생성기용 상세 프롬프트]\` 형식으로 본문에 포함시켜주세요.
5.  **페이지별 이미지 경로**: 이미지 파일명은 'pageN/1.png' 형식이어야 합니다.
6.  **참고 이미지 반영**: 사용자가 업로드한 참고 이미지가 있다면, 그 스타일, 색상, 레이아웃, 분위기를 적극적으로 반영하여 제안해야 합니다.

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}${suggestionsText}
- 페이지 주제: {PAGE_TOPIC}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 창의적으로 서술해주세요.
`;

    for (const [index, page] of projectData.pages.entries()) {
        const pageNumber = index + 1;
        const pageTopicWithContext = `페이지 ${pageNumber}: ${page.topic}`;
        const finalPrompt = layoutPrompt.replace('{PAGE_TOPIC}', pageTopicWithContext)
                                         .replace(/pageN/g, `page${pageNumber}`);
        
        const contents = page.image
            ? { parts: [
                { text: finalPrompt },
                { inlineData: {
                    mimeType: page.image.mimeType,
                    data: page.image.data
                }}
              ]}
            : finalPrompt;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
        });
        
        await sleep(1000); // Add a 1-second delay to avoid hitting rate limits

        const layoutDescription = response.text.trim();
        
        const images = [];
        const imageRegex = /\[IMAGE:\s*([^|]+?)\s*\|\s*([^\]]+?)\]/g;
        let match;
        while ((match = imageRegex.exec(layoutDescription)) !== null) {
            images.push({
                filename: match[1].trim(),
                description: match[2].trim(),
            });
        }
        
        onProgress(page.id, {
            layoutDescription: layoutDescription,
            images: images,
        });
    }
}

export async function generateEnhancementSuggestions(
    step2Spec: Step2Spec, 
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    onProgress: (pageId: string, enhancement: PageEnhancement) => void
): Promise<void> {
    const suggestionsText = projectData.suggestions
        ? `\n- 전체적인 분위기 및 스타일 제안: ${projectData.suggestions}`
        : '';
    
    const enhancementPrompt = `당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentity.moodAndTone}
- **색상**: Primary-${visualIdentity.colorPalette.primary}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}${suggestionsText}
- 페이지 구성안:
{LAYOUT_DESCRIPTION}

### 제안 가이드라인
- **목적 지향적 제안**: "애니메이션을 추가하라"가 아니라, "콘텐츠의 스토리를 강화하고, 사용자의 이해를 돕는 점진적 정보 공개(Progressive Disclosure)를 위한 애니메이션을 제안하라."
- **미세 상호작용**: 버튼 호버 효과와 같은 미세 상호작용(Micro-interaction)으로 페이지에 생동감을 불어넣는 아이디어를 포함하세요.
- **분위기 일관성**: 제안하는 모든 효과는 정의된 '분위기'(${visualIdentity.moodAndTone})와 일치해야 합니다.

### 제안 항목 (JSON 형식으로 출력)
1.  **애니메이션**: 위의 가이드라인에 따라, 콘텐츠 요소들이 나타날 때 적용할 구체적인 CSS 애니메이션 효과를 1-2 문장으로 설명해주세요.
2.  **상호작용**: 학습자의 참여와 이해를 돕는 직관적이고 간단한 인터랙션(예: 호버 시 정보 확장)을 1-2 문장으로 설명해주세요.
    
    출력은 반드시 다음 JSON 형식을 따라야 합니다.`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            animationDescription: { type: Type.STRING },
            interactionDescription: { type: Type.STRING },
        },
        required: ['animationDescription', 'interactionDescription'],
    };

    for (const page of projectData.pages) {
        const pageId = page.id;
        if (!step2Spec[pageId]) continue; 

        const pageProposal = step2Spec[pageId];
        const pagePrompt = enhancementPrompt.replace('{LAYOUT_DESCRIPTION}', pageProposal.layoutDescription);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: pagePrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        await sleep(1000); // Add a 1-second delay to avoid hitting rate limits

        const parsedJson = JSON.parse(response.text.trim());
        onProgress(pageId, {
            animationDescription: parsedJson.animationDescription,
            interactionDescription: parsedJson.interactionDescription,
        });
    }
}

export async function generateCurriculumPlan(userInput: string): Promise<GeneratedPlan> {
    const prompt = `당신은 초중고등학생을 위한 교육 커리큘럼 전문가입니다. 사용자의 요청을 바탕으로, 5~10페이지 분량의 체계적인 교육 콘텐츠 계획안을 생성해주세요. 각 페이지는 5분 내외의 짧은 학습 단위여야 합니다.

### 📜 핵심 규칙
1.  **프로젝트 제목**: 전체 내용을 아우르는 창의적이고 흥미로운 제목을 제안해주세요.
2.  **대상 학습자**: 사용자의 요청에서 대상 학습자를 명확히 파악하여 기재해주세요.
3.  **페이지별 주제**: 논리적인 순서에 따라 각 페이지의 핵심 주제를 명확하고 간결한 문장으로 작성해주세요. (도입 -> 개념 설명 -> 예시 -> 심화/활동 -> 정리 순서를 추천합니다.)
4.  **페이지 수**: 반드시 5개 이상, 10개 이하의 페이지로 구성해야 합니다.

### ユーザーの要求
"${userInput}"

이제 위의 규칙에 따라 JSON 형식으로 계획안을 생성해주세요.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            projectTitle: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            pages: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                    },
                    required: ['topic'],
                },
            },
        },
        required: ['projectTitle', 'targetAudience', 'pages'],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    return JSON.parse(response.text.trim()) as GeneratedPlan;
}
