
import type { ProjectData, Step2Spec, Step3Spec, PageInfo, VisualIdentity } from './types';

const NO_SCROLL_RULES = `
### ⛔ 스크롤 절대 금지 규칙
**이것은 가장 중요한 규칙입니다. 어떤 경우에도 타협 불가!**

1.  **컨테이너 내부 스크롤 완전 금지**
    *   \`overflow: hidden !important;\` 필수 적용
    *   절대로 \`overflow: auto\`, \`overflow: scroll\`, \`overflow-y: auto\` 사용 금지
    *   모든 콘텐츠는 1600x1000px 안에 완벽히 수납되어야 함

2.  **콘텐츠 양 조절 필수**
    *   텍스트가 길면 줄이고 요약하라
    *   이미지 크기를 조절하라
    *   여백과 패딩을 최적화하라
    *   **절대로 스크롤로 해결하려 하지 마라**

3.  **레이아웃 최적화**
    *   모든 요소의 높이를 계산하여 1000px를 초과하지 않도록 조정
    *   padding은 컨테이너 크기 내에서 계산 (box-sizing: border-box 필수)
    *   콘텐츠가 많으면 그리드나 컬럼을 활용하여 가로로 배치

4.  **🔴 최소 폰트 크기 규칙 (매우 중요!) 🔴**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

5.  **🚫 페이지 독립성 규칙 (절대 위반 금지!) 🚫**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지
`;

const TECHNICAL_RULES = `
### 🛠️ 기술적 개발 규칙
1.  **프로젝트 폴더 구조**: 다음과 같은 체계적인 폴더 구조로 결과물을 구성해주세요.
    *   \`/\` (root)
        *   \`page1.html\`, \`page2.html\`, ...
        *   \`css/\`
            *   \`style.css\` (폰트, 색상 등 모든 공통 스타일)
        *   \`js/\`
            *   \`script.js\` (모든 상호작용 관련 JavaScript)
        *   \`images/\`
            *   \`page1/\`
                *   \`1.png\`
            *   \`README.md\`
2.  **하이브리드 스타일링**:
    *   **공통 스타일**: \`css/style.css\`에는 폰트, 색상 변수, 공통 버튼 스타일 등 프로젝트 전반에 사용될 스타일을 정의하세요.
    *   **페이지 전용 스타일**: 각 HTML 파일의 \`<head>\` 안에 \`<style>\` 태그를 사용하여, 해당 페이지에만 적용되는 복잡하고 창의적인 레이아웃(Grid, Flexbox 등)을 자유롭게 작성하세요. 이를 통해 각 페이지의 디자인 품질을 극대화하세요.
3.  **완전히 독립된 페이지**: 각 페이지는 그 자체로 완결된 하나의 독립적인 웹페이지입니다. **절대로** 다른 페이지로 이동하는 링크, '다음'/'이전' 버튼, 메뉴, 또는 외부 사이트로 나가는 하이퍼링크를 포함해서는 안 됩니다.
4.  **이미지 관리**:
    *   **경로**: 이미지는 반드시 페이지별 하위 폴더에 저장하고, HTML에서는 \`<img src="./images/page1/1.png">\` 와 같은 상대 경로를 사용해야 합니다.
    *   **README.md 가이드**: \`images/README.md\` 파일에는 각 이미지에 대한 **AI 이미지 생성기용 프롬프트**를 상세히 작성해야 합니다.
        *   **나쁜 예시**: "뉴런 다이어그램"
        *   **좋은 예시 (page1/1.png)**: "A clean, minimalist diagram of a neural network with three layers (input, hidden, output). Use soft blue nodes for neurons and light gray arrows for connections. The style should be flat, modern, and easy to understand for a middle school student. White background."
`;

const DESIGN_RULES = `
### ✨ 디자인 및 애니메이션 가이드라인
1.  **디자인 시스템 준수**: 아래에 정의된 '디자인 시스템'의 색상, 타이포그래피, 스타일 가이드를 모든 페이지에서 일관되게 적용해주세요.
2.  **이미지 사용 최소화**: 학습 내용에 필수적인 이미지만 사용하세요. 의미 없는 장식용 이미지는 피하고, 여백과 타이포그래피를 활용해 디자인을 완성하세요.
3.  **애니메이션**:
    *   **방향성**: 모든 애니메이션은 학습자의 시선 흐름을 자연스럽게 유도해야 합니다. (예: 왼쪽에서 오른쪽으로, 위에서 아래로)
    *   **자연스러움**: \`transition: all 0.5s ease-in-out;\` 과 같이 부드러운 \`ease\` 함수를 사용하세요. 너무 빠르거나 갑작스러운 움직임은 피해주세요.
`;

export function generateFinalPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step2Spec: Step2Spec,
    step3Spec: Step3Spec
): string {
  const pagePrompts = projectData.pages.map((page: PageInfo, index: number) => {
    const pageNumber = index + 1;
    const proposal = step2Spec[page.id];
    const enhancement = step3Spec[page.id];

    if (!proposal || !enhancement) return '';

    const imageList = (proposal.images && proposal.images.length > 0)
        ? proposal.images.map(img => `- **${img.filename}**: ${img.description}`).join('\n')
        : `- 이 페이지에는 이미지가 계획되지 않았습니다.`;

    return `
## 페이지 ${pageNumber}: ${page.topic}

### 1. 페이지 구성 및 내용
\`\`\`
${proposal.layoutDescription}
\`\`\`

### 2. 페이지에 사용될 이미지
${imageList}

### 3. 애니메이션 및 상호작용
- **애니메이션**: ${enhancement.animationDescription}
- **상호작용**: ${enhancement.interactionDescription}
`;
  }).join('');

  const designSystemPrompt = `
## 2. 디자인 시스템
- **분위기 & 톤**: ${visualIdentity.moodAndTone}
- **색상 팔레트 (css/style.css 에 변수로 정의할 것)**:
  --primary-color: ${visualIdentity.colorPalette.primary};
  --secondary-color: ${visualIdentity.colorPalette.secondary};
  --accent-color: ${visualIdentity.colorPalette.accent};
  --text-color: ${visualIdentity.colorPalette.text};
  --background-color: ${visualIdentity.colorPalette.background};
- **타이포그래피 (css/style.css 에 정의할 것)**:
  - Heading Font: ${visualIdentity.typography.headingFont}
  - Body Font: ${visualIdentity.typography.bodyFont}
  - Base Size: ${visualIdentity.typography.baseSize}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}
`;

  return `
# 최종 교안 개발 프롬프트

## 1. 프로젝트 개요
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **사용자 추가 제안**: ${projectData.suggestions || '없음'}
${designSystemPrompt}
## 3. 핵심 개발 요구사항
${NO_SCROLL_RULES}
${TECHNICAL_RULES}
${DESIGN_RULES}

## 4. 페이지별 상세 구현 가이드
${pagePrompts}
`;
}
