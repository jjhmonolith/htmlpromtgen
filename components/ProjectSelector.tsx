import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { NewProjectModal } from './NewProjectModal';
import type { ProjectMetadata, SavedProject } from '../types';

interface ProjectSelectorProps {
  onProjectSelect: (project: SavedProject) => void;
  onNewProject: (title: string) => void;
  currentProjectId?: string | null;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ 
  onProjectSelect, 
  onNewProject,
  currentProjectId 
}) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const projectList = storageService.getProjectList();
    setProjects(projectList);
  };

  const handleProjectSelect = (projectId: string) => {
    const project = storageService.getProject(projectId);
    if (project) {
      onProjectSelect(project);
      setIsOpen(false);
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
      storageService.deleteProject(projectId);
      loadProjects();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getStepName = (step: number) => {
    const stepNames = ['기본 정보', '비주얼 아이덴티티', '레이아웃', '애니메이션', '프롬프트'];
    return stepNames[step - 1] || '기본 정보';
  };

  const handleNewProject = (title: string) => {
    setShowNewProjectModal(false);
    setIsOpen(false);
    onNewProject(title);
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-40 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <span>📂</span>
          <span>프로젝트</span>
          {currentProjectId && (
            <span className="text-xs text-gray-500">•</span>
          )}
        </button>
        <NewProjectModal 
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onCreate={handleNewProject}
        />
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">프로젝트 선택</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">저장된 프로젝트가 없습니다</p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 프로젝트 시작하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* New Project Card */}
              <div
                onClick={() => setShowNewProjectModal(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">➕</div>
                  <p className="font-semibold text-gray-700">새 프로젝트</p>
                  <p className="text-sm text-gray-500 mt-1">새로운 교육 콘텐츠 만들기</p>
                </div>
              </div>

              {/* Existing Projects */}
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group relative"
                >
                  <button
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑️
                  </button>
                  
                  <h3 className="font-bold text-gray-800 mb-2 pr-8 truncate">
                    {project.name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📍 {getStepName(project.currentStep)} 단계</p>
                    <p>📅 {formatDate(project.updatedAt)}</p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 h-2 rounded ${
                            step <= project.currentStep
                              ? 'bg-blue-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NewProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={handleNewProject}
      />
    </div>
  );
};