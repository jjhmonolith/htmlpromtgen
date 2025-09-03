
export interface PageInfo {
  id: string;
  topic: string;
  image?: {
    filename: string;
    mimeType: string;
    data: string; // base64 encoded
  };
  // Content analysis fields
  contentAnalysis?: {
    outline: string[];  // AI generated content outline
    estimatedSections: number;
    densityScore: number; // 0-1, where 1 is very dense
    suggestedSplit?: {
      shouldSplit: boolean;
      splitInto: number;
      splitSuggestions: Array<{
        topic: string;
        outline: string[];
      }>;
    };
  };
}

export interface ProjectData {
  projectTitle: string;
  targetAudience: string;
  pages: PageInfo[];
  suggestions?: string;
}

export interface ImagePlaceholder {
  filename: string; // "1.png", "2.png"
  description: string; // "A diagram of a neural network"
}

// Data for Step 2: Visual Identity
export interface ColorPalette {
  primary: string; // hex code
  secondary: string; // hex code
  accent: string; // hex code
  text: string; // hex code
  background: string; // hex code
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
  baseSize: string; // e.g., "16px"
}

export interface VisualIdentity {
  moodAndTone: string;
  colorPalette: ColorPalette;
  typography: Typography;
  componentStyle: string;
}

// Data for Step 3
export interface PageProposal {
  layoutDescription: string;
  images: ImagePlaceholder[];
}
export type Step2Spec = Record<string, PageProposal>;

// Data for Step 4
export interface PageEnhancement {
  animationDescription: string;
  interactionDescription: string;
}
export type Step3Spec = Record<string, PageEnhancement>;


export enum Step {
  BasicInfo = 1,
  VisualIdentity = 2,
  PageProposal = 3,
  Enhancements = 4,
  FinalPrompt = 5,
}

// For AI-generated curriculum plan
export interface GeneratedPlan {
  projectTitle: string;
  targetAudience: string;
  pages: {
    topic: string;
  }[];
}

// Project Save Types
export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: Step;
  data: {
    projectData: ProjectData;
    visualIdentity?: VisualIdentity;
    step2Spec?: Step2Spec;
    step3Spec?: Step3Spec;
    finalPrompt?: string;
  };
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: Step;
}
