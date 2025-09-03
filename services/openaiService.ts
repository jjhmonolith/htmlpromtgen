import OpenAI from "openai";
import type { ProjectData, Step2Spec, PageProposal, PageEnhancement, GeneratedPlan, VisualIdentity, PageInfo } from '../types';

const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
    dangerouslyAllowBrowser: true // Note: In production, use a backend proxy for security
});

// Reduced delay for better performance
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Batch size for parallel processing
const BATCH_SIZE = 3;
const DELAY_BETWEEN_BATCHES = 200; // Reduced from 1000ms

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
반드시 다음 JSON 형식으로 응답해주세요:
{
    "moodAndTone": "활기찬, 재미있는, 다채로운, 친근한",
    "colorPalette": {
        "primary": "#4F46E5",
        "secondary": "#7C3AED",
        "accent": "#F59E0B",
        "text": "#1F2937",
        "background": "#FFFFFF"
    },
    "typography": {
        "headingFont": "Inter, system-ui, sans-serif",
        "bodyFont": "Inter, system-ui, sans-serif",
        "baseSize": "16px"
    },
    "componentStyle": "버튼은 모서리가 둥글고 호버 시 살짝 위로 올라가는 효과를 줍니다. 카드는 부드러운 그림자와 함께 깨끗한 흰색 배경을 가집니다."
}
`;

    const response = await client.responses.create({
        model: "gpt-5",
        input: [
            {
                role: "system",
                content: "You are an expert art director specializing in educational content design. Always respond in valid JSON format."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    });

    try {
        return JSON.parse(response.output_text) as VisualIdentity;
    } catch (error) {
        console.error("Failed to parse JSON response:", error);
        throw new Error("Invalid response format from AI");
    }
}

// Improved with batch processing and context passing
export async function generateInitialProposals(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    onProgress: (pageId: string, proposal: PageProposal) => void
): Promise<void> {
    const suggestionsText = projectData.suggestions
        ? `\n- 사용자 추가 제안사항: ${projectData.suggestions}`
        : '';
    
    // Process pages in batches of 3 for better performance
    for (let i = 0; i < projectData.pages.length; i += BATCH_SIZE) {
        const batch = projectData.pages.slice(i, Math.min(i + BATCH_SIZE, projectData.pages.length));
        
        // Create promises for parallel processing
        const batchPromises = batch.map(async (page, batchIndex) => {
            const globalIndex = i + batchIndex;
            const pageNumber = globalIndex + 1;
            
            // Add context from adjacent pages
            const prevPageContext = globalIndex > 0 
                ? `이전 페이지: ${projectData.pages[globalIndex - 1].topic}`
                : '첫 페이지입니다';
            
            const nextPageContext = globalIndex < projectData.pages.length - 1
                ? `다음 페이지: ${projectData.pages[globalIndex + 1].topic}`
                : '마지막 페이지입니다';
            
            const layoutPrompt = `당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 스크롤 없는 1600x1000px 화면에 들어갈 콘텐츠 레이아웃을 **자유롭게, 상세하게, 창의적으로 서술**해주세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentity.moodAndTone}
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 흐르도록 유도하고, 콘텐츠를 단순히 박스에 넣는 것이 아니라 콘텐츠 자체의 형태에 맞는 맞춤형 디자인을 하세요.

### 📍 페이지 컨텍스트
- ${prevPageContext}
- **현재 페이지 ${pageNumber}: ${page.topic}**
- ${nextPageContext}
${page.contentAnalysis ? `
### 📊 콘텐츠 분석 결과
- **예상 구성**: ${page.contentAnalysis.outline.join(', ')}
- **예상 섹션 수**: ${page.contentAnalysis.estimatedSections}개
- **콘텐츠 밀도**: ${page.contentAnalysis.densityScore >= 0.8 ? '높음 (분할 권장)' : page.contentAnalysis.densityScore >= 0.6 ? '적정' : '여유'}
` : ''}

### 📜 핵심 규칙
1.  **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요.
2.  **공간 최적화**: 콘텐츠를 화면에 효과적으로 배치하여 어색한 빈 공간이 생기지 않도록 하세요.
3.  **이미지 최소화**: 학습에 필수적인 이미지만 사용하고, 장식용 이미지는 피하세요.
4.  **상세한 이미지 프롬프트**: 이미지 계획이 있다면, \`[IMAGE: page${pageNumber}/1.png | AI 이미지 생성기용 상세 프롬프트]\` 형식으로 본문에 포함시켜주세요.
5.  **페이지 간 연결성**: 이전/다음 페이지와의 자연스러운 흐름을 고려하세요.

### 🚫 절대 금지 사항
- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.
- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.
- **최소 폰트 크기**: 모든 텍스트는 반드시 18pt 이상으로 설정하세요. 본문은 18-20pt, 제목은 24pt 이상을 권장합니다.

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}${suggestionsText}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 창의적으로 서술해주세요.
`;
            
            const inputContent: any[] = [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: layoutPrompt
                        }
                    ]
                }
            ];

            // Add image if available
            if (page.image) {
                inputContent[0].content.push({
                    type: "input_image",
                    image_url: `data:${page.image.mimeType};base64,${page.image.data}`
                });
            }
            
            try {
                const response = await client.responses.create({
                    model: "gpt-5",
                    input: inputContent
                });
                
                const layoutDescription = response.output_text.trim();
                
                const images = [];
                const imageRegex = /\[IMAGE:\s*([^|]+?)\s*\|\s*([^\]]+?)\]/g;
                let match;
                while ((match = imageRegex.exec(layoutDescription)) !== null) {
                    images.push({
                        filename: match[1].trim(),
                        description: match[2].trim(),
                    });
                }
                
                return {
                    pageId: page.id,
                    proposal: {
                        layoutDescription: layoutDescription,
                        images: images,
                    }
                };
            } catch (error) {
                console.error(`Error generating layout for page ${pageNumber}:`, error);
                return {
                    pageId: page.id,
                    proposal: {
                        layoutDescription: `페이지 ${pageNumber}: ${page.topic}에 대한 기본 레이아웃`,
                        images: [],
                    }
                };
            }
        });
        
        // Wait for all promises in the batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Process results and call onProgress
        batchResults.forEach(result => {
            onProgress(result.pageId, result.proposal);
        });
        
        // Add a small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < projectData.pages.length) {
            await sleep(DELAY_BETWEEN_BATCHES);
        }
    }
}

// Improved with batch processing
export async function generateEnhancementSuggestions(
    step2Spec: Step2Spec, 
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    onProgress: (pageId: string, enhancement: PageEnhancement) => void
): Promise<void> {
    const suggestionsText = projectData.suggestions
        ? `\n- 전체적인 분위기 및 스타일 제안: ${projectData.suggestions}`
        : '';
    
    // Process pages in batches
    const pageIds = Object.keys(step2Spec);
    
    for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
        const batchIds = pageIds.slice(i, Math.min(i + BATCH_SIZE, pageIds.length));
        
        const batchPromises = batchIds.map(async (pageId) => {
            const page = projectData.pages.find(p => p.id === pageId);
            if (!page || !step2Spec[pageId]) return null;
            
            const pageProposal = step2Spec[pageId];
            const pageIndex = projectData.pages.findIndex(p => p.id === pageId);
            
            // Add context about page position
            const positionContext = pageIndex === 0 ? '도입부 페이지' :
                                   pageIndex === projectData.pages.length - 1 ? '마무리 페이지' :
                                   '중간 페이지';
            
            const enhancementPrompt = `당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentity.moodAndTone}
- **색상**: Primary-${visualIdentity.colorPalette.primary}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}${suggestionsText}
- 페이지 위치: ${positionContext}
- 페이지 구성안:
${pageProposal.layoutDescription}
${page.contentAnalysis ? `
### 📊 콘텐츠 구성 정보
- **주요 내용**: ${page.contentAnalysis.outline.join(', ')}
- **섹션 수**: ${page.contentAnalysis.estimatedSections}개
- **콘텐츠 밀도**: ${page.contentAnalysis.densityScore >= 0.8 ? '높음' : page.contentAnalysis.densityScore >= 0.6 ? '적정' : '여유'}
` : ''}

### 제안 가이드라인
- **목적 지향적 제안**: "애니메이션을 추가하라"가 아니라, "콘텐츠의 스토리를 강화하고, 사용자의 이해를 돕는 점진적 정보 공개(Progressive Disclosure)를 위한 애니메이션을 제안하라."
- **미세 상호작용**: 버튼 호버 효과와 같은 미세 상호작용(Micro-interaction)으로 페이지에 생동감을 불어넣는 아이디어를 포함하세요.
- **분위기 일관성**: 제안하는 모든 효과는 정의된 '분위기'(${visualIdentity.moodAndTone})와 일치해야 합니다.
- **페이지 위치 고려**: ${positionContext === '도입부 페이지' ? '임팩트 있는 시작 효과' :
                         positionContext === '마무리 페이지' ? '전체를 정리하는 마무리 효과' :
                         '자연스러운 전환 효과'}를 포함하세요.

### 🚫 절대 금지 사항 (매우 중요!)
- **네비게이션 금지**: 페이지 간 이동을 위한 버튼, 링크, 화살표, 네비게이션 바 등을 절대 만들지 마세요.
- **페이지 연결 금지**: "다음 페이지로", "이전으로 돌아가기" 같은 상호작용을 절대 제안하지 마세요.
- **독립적 페이지**: 각 페이지는 완전히 독립적인 HTML 파일로, 다른 페이지와 연결되지 않습니다.
- **최소 폰트 크기 강제**: 모든 텍스트 애니메이션과 효과에서도 18pt 이상 유지를 명시하세요.

### 제안 항목 (JSON 형식으로 출력)
반드시 다음 JSON 형식으로 응답해주세요:
{
    "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
    "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}`;
            
            try {
                const response = await client.responses.create({
                    model: "gpt-5",
                    input: [
                        {
                            role: "system",
                            content: "You are an expert UI/UX designer. Always respond in valid JSON format."
                        },
                        {
                            role: "user",
                            content: enhancementPrompt
                        }
                    ]
                });
                
                const parsedJson = JSON.parse(response.output_text.trim());
                return {
                    pageId: pageId,
                    enhancement: {
                        animationDescription: parsedJson.animationDescription,
                        interactionDescription: parsedJson.interactionDescription,
                    }
                };
            } catch (error) {
                console.error("Failed to parse enhancement response:", error);
                return {
                    pageId: pageId,
                    enhancement: {
                        animationDescription: "기본 페이드인 애니메이션을 적용합니다.",
                        interactionDescription: "호버 효과와 클릭 피드백을 제공합니다.",
                    }
                };
            }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Process results
        batchResults.forEach(result => {
            if (result) {
                onProgress(result.pageId, result.enhancement);
            }
        });
        
        // Small delay between batches
        if (i + BATCH_SIZE < pageIds.length) {
            await sleep(DELAY_BETWEEN_BATCHES);
        }
    }
}

export async function generateCurriculumPlan(userInput: string): Promise<GeneratedPlan> {
    const prompt = `당신은 초중고등학생을 위한 교육 커리큘럼 전문가입니다. 사용자의 요청을 바탕으로, 5~10페이지 분량의 체계적인 교육 콘텐츠 계획안을 생성해주세요. 각 페이지는 5분 내외의 짧은 학습 단위여야 합니다.

### 📜 핵심 규칙
1.  **프로젝트 제목**: 전체 내용을 아우르는 창의적이고 흥미로운 제목을 제안해주세요.
2.  **대상 학습자**: 사용자의 요청에서 대상 학습자를 명확히 파악하여 기재해주세요.
3.  **페이지별 주제**: 논리적인 순서에 따라 각 페이지의 핵심 주제를 명확하고 간결한 문장으로 작성해주세요. (도입 -> 개념 설명 -> 예시 -> 심화/활동 -> 정리 순서를 추천합니다.)
4.  **페이지 수**: 반드시 5개 이상, 10개 이하의 페이지로 구성해야 합니다.

### 사용자의 요구
"${userInput}"

이제 위의 규칙에 따라 다음 JSON 형식으로 계획안을 생성해주세요:
{
    "projectTitle": "프로젝트 제목",
    "targetAudience": "대상 학습자",
    "pages": [
        { "topic": "페이지 1 주제" },
        { "topic": "페이지 2 주제" },
        ...
    ]
}`;

    const response = await client.responses.create({
        model: "gpt-5",
        input: [
            {
                role: "system",
                content: "You are an educational curriculum expert. Always respond in valid JSON format in Korean."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    });

    try {
        return JSON.parse(response.output_text.trim()) as GeneratedPlan;
    } catch (error) {
        console.error("Failed to parse curriculum plan:", error);
        throw new Error("Invalid response format from AI");
    }
}
// New function to analyze content volume for each page
export async function analyzeContentVolume(projectData: ProjectData): Promise<PageInfo[]> {
    const prompt = `당신은 교육 콘텐츠 분량 평가 전문가입니다. 각 페이지의 주제를 분석하여 1600x1000px 화면에 들어갈 적정 콘텐츠 분량을 평가해주세요.

### 📜 프로젝트 정보
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}

### 📋 평가 기준
1. **분량 점수 (0-1)**: 0.8 이상이면 내용이 너무 많음, 0.6-0.8은 적정, 0.6 미만은 여유 있음
2. **예상 섹션 수**: 각 페이지에 필요한 주요 섹션 개수
3. **내용 개요**: 각 페이지에 들어갈 주요 내용 3-5개 항목
4. **분할 제안**: 내용이 너무 많은 경우(0.8 이상), 어떻게 분할할지 제안

### 페이지 목록
${projectData.pages.map((page, index) => `페이지 ${index + 1}: ${page.topic}`).join('\n')}

### 출력 형식
각 페이지에 대해 다음 형식의 JSON 배열로 응답해주세요:
[
    {
        "pageId": "페이지 ID",
        "outline": ["주요 내용 1", "주요 내용 2", "주요 내용 3"],
        "estimatedSections": 4,
        "densityScore": 0.7,
        "suggestedSplit": {
            "shouldSplit": false,
            "splitInto": 1,
            "splitSuggestions": []
        }
    },
    // 내용이 많은 경우 예시:
    {
        "pageId": "페이지 ID",
        "outline": ["내용1", "내용2", "내용3", "내용4", "내용5"],
        "estimatedSections": 8,
        "densityScore": 0.9,
        "suggestedSplit": {
            "shouldSplit": true,
            "splitInto": 2,
            "splitSuggestions": [
                {
                    "topic": "분할된 페이지 1 주제",
                    "outline": ["내용1", "내용2", "내용3"]
                },
                {
                    "topic": "분할된 페이지 2 주제", 
                    "outline": ["내용4", "내용5"]
                }
            ]
        }
    }
]`;

    try {
        const response = await client.responses.create({
            model: "gpt-5",
            input: [
                {
                    role: "system",
                    content: "You are an expert in educational content volume assessment. Always respond in valid JSON format in Korean."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const analysisResults = JSON.parse(response.output_text.trim()) as any[];
        
        // Map the analysis results back to the pages
        return projectData.pages.map((page, index) => {
            const analysis = analysisResults[index];
            if (analysis) {
                return {
                    ...page,
                    contentAnalysis: {
                        outline: analysis.outline,
                        estimatedSections: analysis.estimatedSections,
                        densityScore: analysis.densityScore,
                        suggestedSplit: analysis.suggestedSplit
                    }
                };
            }
            return page;
        });
    } catch (error) {
        console.error("Failed to analyze content volume:", error);
        throw new Error("Content analysis failed");
    }
}
