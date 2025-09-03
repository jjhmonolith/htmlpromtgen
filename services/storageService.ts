import type { SavedProject, ProjectMetadata, ProjectData, VisualIdentity, Step2Spec, Step3Spec } from '../types';
import { Step } from '../types';

const STORAGE_KEYS = {
  PROJECT_LIST: 'educontent-projects-list',
  PROJECT_PREFIX: 'educontent-project-',
  CURRENT_PROJECT: 'educontent-current-project',
  AUTOSAVE_ENABLED: 'educontent-autosave-enabled',
} as const;

class StorageService {
  // Generate unique ID
  private generateId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all project metadata
  getProjectList(): ProjectMetadata[] {
    try {
      const list = localStorage.getItem(STORAGE_KEYS.PROJECT_LIST);
      return list ? JSON.parse(list) : [];
    } catch (error) {
      console.error('Failed to get project list:', error);
      return [];
    }
  }

  // Save project metadata list
  private saveProjectList(list: ProjectMetadata[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_LIST, JSON.stringify(list));
    } catch (error) {
      console.error('Failed to save project list:', error);
      throw error;
    }
  }

  // Get a specific project
  getProject(id: string): SavedProject | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.PROJECT_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  // Save or update a project
  saveProject(project: SavedProject): void {
    try {
      // Save the full project data
      localStorage.setItem(
        `${STORAGE_KEYS.PROJECT_PREFIX}${project.id}`,
        JSON.stringify(project)
      );

      // Update project list
      const list = this.getProjectList();
      const metadata: ProjectMetadata = {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        currentStep: project.currentStep,
      };

      const existingIndex = list.findIndex(p => p.id === project.id);
      if (existingIndex >= 0) {
        list[existingIndex] = metadata;
      } else {
        list.unshift(metadata); // Add to beginning
      }

      this.saveProjectList(list);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  // Create a new project
  createProject(
    projectData: ProjectData,
    currentStep: Step = Step.BasicInfo
  ): SavedProject {
    const now = new Date().toISOString();
    const project: SavedProject = {
      id: this.generateId(),
      name: projectData.projectTitle || '새 프로젝트',
      createdAt: now,
      updatedAt: now,
      currentStep,
      data: {
        projectData,
      },
    };

    this.saveProject(project);
    this.setCurrentProjectId(project.id);
    return project;
  }

  // Update existing project
  updateProject(
    id: string,
    updates: Partial<{
      name: string;
      currentStep: Step;
      projectData: ProjectData;
      visualIdentity: VisualIdentity;
      step2Spec: Step2Spec;
      step3Spec: Step3Spec;
      finalPrompt: string;
    }>
  ): SavedProject | null {
    const project = this.getProject(id);
    if (!project) return null;

    // Update fields
    if (updates.name !== undefined) project.name = updates.name;
    if (updates.currentStep !== undefined) project.currentStep = updates.currentStep;
    if (updates.projectData !== undefined) project.data.projectData = updates.projectData;
    if (updates.visualIdentity !== undefined) project.data.visualIdentity = updates.visualIdentity;
    if (updates.step2Spec !== undefined) project.data.step2Spec = updates.step2Spec;
    if (updates.step3Spec !== undefined) project.data.step3Spec = updates.step3Spec;
    if (updates.finalPrompt !== undefined) project.data.finalPrompt = updates.finalPrompt;

    project.updatedAt = new Date().toISOString();

    this.saveProject(project);
    return project;
  }

  // Delete a project
  deleteProject(id: string): boolean {
    try {
      // Remove from localStorage
      localStorage.removeItem(`${STORAGE_KEYS.PROJECT_PREFIX}${id}`);

      // Update project list
      const list = this.getProjectList();
      const filtered = list.filter(p => p.id !== id);
      this.saveProjectList(filtered);

      // Clear current project if it was deleted
      if (this.getCurrentProjectId() === id) {
        this.clearCurrentProjectId();
      }

      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  // Get current project ID
  getCurrentProjectId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
  }

  // Set current project ID
  setCurrentProjectId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, id);
  }

  // Clear current project ID
  clearCurrentProjectId(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
  }

  // Get current project
  getCurrentProject(): SavedProject | null {
    const id = this.getCurrentProjectId();
    return id ? this.getProject(id) : null;
  }

  // Check if autosave is enabled
  isAutosaveEnabled(): boolean {
    const value = localStorage.getItem(STORAGE_KEYS.AUTOSAVE_ENABLED);
    return value !== 'false'; // Default to true
  }

  // Set autosave preference
  setAutosaveEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE_ENABLED, String(enabled));
  }

  // Clear all data (for debugging/reset)
  clearAllData(): void {
    const list = this.getProjectList();
    list.forEach(project => {
      localStorage.removeItem(`${STORAGE_KEYS.PROJECT_PREFIX}${project.id}`);
    });
    localStorage.removeItem(STORAGE_KEYS.PROJECT_LIST);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
    localStorage.removeItem(STORAGE_KEYS.AUTOSAVE_ENABLED);
  }

  // Export project as JSON
  exportProject(id: string): string | null {
    const project = this.getProject(id);
    if (!project) return null;
    return JSON.stringify(project, null, 2);
  }

  // Import project from JSON
  importProject(jsonString: string): SavedProject | null {
    try {
      const project = JSON.parse(jsonString) as SavedProject;
      
      // Generate new ID to avoid conflicts
      project.id = this.generateId();
      project.updatedAt = new Date().toISOString();
      
      // Save the imported project
      this.saveProject(project);
      return project;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();