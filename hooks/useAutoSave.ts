import { useEffect, useRef, useCallback } from 'react';
import { storageService } from '../services/storageService';
import type { ProjectData, VisualIdentity, Step2Spec, Step3Spec, Step } from '../types';

interface AutoSaveProps {
  projectId: string | null;
  projectData: ProjectData;
  currentStep: Step;
  visualIdentity: VisualIdentity | null;
  step2Spec: Step2Spec | null;
  step3Spec: Step3Spec | null;
  onSaveStatusChange: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export function useAutoSave({
  projectId,
  projectData,
  currentStep,
  visualIdentity,
  step2Spec,
  step3Spec,
  onSaveStatusChange,
}: AutoSaveProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Create a hash of current data to detect changes
  const getCurrentDataHash = useCallback(() => {
    return JSON.stringify({
      projectData,
      currentStep,
      visualIdentity,
      step2Spec,
      step3Spec,
    });
  }, [projectData, currentStep, visualIdentity, step2Spec, step3Spec]);

  // Save function
  const save = useCallback(async () => {
    if (!projectId || isSavingRef.current) return;
    
    const currentHash = getCurrentDataHash();
    
    // Skip if no changes
    if (currentHash === lastSavedDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    onSaveStatusChange('saving');

    try {
      storageService.updateProject(projectId, {
        name: projectData.projectTitle || '새 프로젝트',
        currentStep,
        projectData,
        visualIdentity: visualIdentity || undefined,
        step2Spec: step2Spec || undefined,
        step3Spec: step3Spec || undefined,
      });

      lastSavedDataRef.current = currentHash;
      onSaveStatusChange('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        onSaveStatusChange('idle');
      }, 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      onSaveStatusChange('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        onSaveStatusChange('idle');
      }, 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId, projectData, currentStep, visualIdentity, step2Spec, step3Spec, getCurrentDataHash, onSaveStatusChange]);

  // Debounced auto-save
  useEffect(() => {
    if (!projectId || !storageService.isAutosaveEnabled()) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (500ms delay)
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, 500);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, getCurrentDataHash, save]);

  // Save immediately when component unmounts or projectId changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Force immediate save on unmount
      if (projectId && !isSavingRef.current) {
        const currentHash = getCurrentDataHash();
        if (currentHash !== lastSavedDataRef.current) {
          save();
        }
      }
    };
  }, [projectId, save, getCurrentDataHash]);

  // Manual save function
  const saveManually = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  }, [save]);

  return {
    saveManually,
    isSaving: isSavingRef.current,
  };
}