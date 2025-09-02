
export interface PageInfo {
  id: string;
  topic: string;
  image?: {
    filename: string;
    mimeType: string;
    data: string; // base64 encoded
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
