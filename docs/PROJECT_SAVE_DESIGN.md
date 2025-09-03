# 프로젝트 저장 기능 설계 문서

## 📋 개요
사용자가 교육 콘텐츠 생성 프로젝트를 로컬에 저장하고, 나중에 불러와서 이어서 작업하거나 수정할 수 있는 기능을 제공합니다.

## 🎯 주요 기능

### 1. 프로젝트 저장
- **자동 저장**: 각 단계 완료 시 자동으로 진행 상황 저장
- **수동 저장**: 사용자가 원할 때 현재 상태 저장
- **다중 프로젝트**: 여러 프로젝트를 동시에 관리

### 2. 프로젝트 불러오기
- **프로젝트 목록**: 저장된 모든 프로젝트 표시
- **검색/필터링**: 프로젝트 이름, 날짜로 검색
- **이어서 작업**: 중단된 단계부터 계속 진행

### 3. 프로젝트 관리
- **수정**: 이전 단계로 돌아가서 수정 가능
- **복제**: 기존 프로젝트를 복사해서 새 프로젝트 생성
- **삭제**: 불필요한 프로젝트 제거
- **내보내기/가져오기**: JSON 파일로 백업 및 공유

## 🏗 아키텍처

### 데이터 모델

```typescript
// 저장되는 프로젝트 데이터 구조
interface SavedProject {
  id: string;                    // 고유 식별자 (UUID)
  name: string;                   // 프로젝트 이름
  createdAt: string;             // 생성 시간
  updatedAt: string;             // 최종 수정 시간
  currentStep: Step;             // 현재 진행 단계
  thumbnail?: string;            // 미리보기 이미지 (선택)
  data: {
    // Step 1 데이터
    projectData: ProjectData;
    
    // Step 1.5 데이터
    visualIdentity?: VisualIdentity;
    
    // Step 2 데이터
    step2Spec?: Step2Spec;
    
    // Step 3 데이터
    step3Spec?: Step3Spec;
    
    // Step 4 데이터
    finalPrompt?: string;
  };
}

// 프로젝트 메타데이터 (목록 표시용)
interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: Step;
  thumbnail?: string;
}
```

### 저장 전략

#### LocalStorage 구조
```
educontent-projects-list    // 프로젝트 메타데이터 배열
educontent-project-{id}      // 개별 프로젝트 전체 데이터
educontent-current-project   // 현재 작업 중인 프로젝트 ID
educontent-autosave-enabled  // 자동 저장 설정
```

#### 저장 용량 관리
- LocalStorage 기본 제한: 5-10MB
- 대용량 데이터 압축 (LZ-string 라이브러리 사용)
- 이미지는 base64 대신 크기 최적화
- 오래된 자동 저장 자동 삭제

## 🔧 구현 계획

### Phase 1: 핵심 저장 기능
1. **StorageService 구현** (`services/storageService.ts`)
   - 프로젝트 CRUD 작업
   - LocalStorage 래퍼 함수
   - 데이터 압축/압축 해제

2. **자동 저장 Hook** (`hooks/useAutoSave.ts`)
   - 디바운스된 자동 저장
   - 저장 상태 표시
   - 충돌 방지

### Phase 2: UI 컴포넌트
1. **ProjectManager 컴포넌트** (`components/ProjectManager.tsx`)
   - 프로젝트 목록 그리드/리스트 뷰
   - 검색 및 정렬 기능
   - 프로젝트 카드 (썸네일, 정보, 액션)

2. **SaveIndicator 컴포넌트** (`components/SaveIndicator.tsx`)
   - 저장 상태 표시 (저장 중, 저장됨, 오류)
   - 마지막 저장 시간
   - 수동 저장 버튼

### Phase 3: 고급 기능
1. **내보내기/가져오기**
   - JSON 파일 다운로드
   - 파일 업로드 및 검증
   - 버전 호환성 체크

2. **프로젝트 버전 관리**
   - 체크포인트 생성
   - 실행 취소/다시 실행
   - 변경 내역 추적

## 💻 사용자 인터페이스

### 시작 화면 변경
```
[새 프로젝트] [기존 프로젝트 열기] [가져오기]
```

### 프로젝트 목록 화면
```
┌─────────────────────────────────────┐
│ 🔍 검색...           [그리드] [리스트] │
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │      │ │      │ │  +   │         │
│ │ 썸네일│ │ 썸네일│ │ 새로  │         │
│ │      │ │      │ │ 만들기│         │
│ └──────┘ └──────┘ └──────┘         │
│ 프로젝트1 프로젝트2                   │
│ 2일 전    어제                       │
└─────────────────────────────────────┘
```

### 작업 중 저장 표시
```
상단바: [💾 자동 저장 됨 (2분 전)] [수동 저장]
```

## 🔄 사용 시나리오

### 시나리오 1: 새 프로젝트 시작
1. 앱 접속 → "새 프로젝트" 선택
2. Step 1 완료 → 자동 저장
3. 각 단계 진행 → 자동 저장
4. 브라우저 종료

### 시나리오 2: 기존 프로젝트 이어서
1. 앱 접속 → "기존 프로젝트 열기"
2. 프로젝트 목록에서 선택
3. 중단된 단계부터 계속
4. 수정 및 저장

### 시나리오 3: 프로젝트 공유
1. 프로젝트 목록 → 내보내기
2. JSON 파일 다운로드
3. 다른 컴퓨터에서 가져오기
4. 작업 계속

## 🛠 기술 스택

### 필수 라이브러리
- **uuid**: 고유 ID 생성
- **lz-string**: 데이터 압축
- **date-fns**: 날짜 포맷팅

### 선택 라이브러리
- **dexie**: IndexedDB 래퍼 (대용량 저장 시)
- **file-saver**: 파일 다운로드
- **react-dropzone**: 파일 업로드 UI

## ⚠️ 고려사항

### 보안
- XSS 방지를 위한 입력 검증
- 민감한 정보 암호화 (선택)
- CORS 정책 준수

### 성능
- 큰 프로젝트의 지연 로딩
- 썸네일 생성 최적화
- 메모리 관리

### 호환성
- 브라우저 LocalStorage 지원 확인
- 버전 마이그레이션 전략
- 폴백 옵션 (쿠키, SessionStorage)

## 📝 구현 우선순위

1. **Phase 1** (필수)
   - StorageService 기본 CRUD
   - 현재 프로젝트 자동 저장
   - 간단한 불러오기 기능

2. **Phase 2** (권장)
   - 프로젝트 목록 UI
   - 검색 및 정렬
   - 저장 상태 표시

3. **Phase 3** (선택)
   - 내보내기/가져오기
   - 버전 관리
   - 고급 UI 기능

## 🚀 다음 단계

이 설계를 바탕으로 실제 구현을 진행하시겠습니까? 
구현 시작 시 다음 순서를 추천합니다:

1. StorageService 구현
2. 기존 App.tsx에 저장 로직 통합
3. ProjectManager UI 구현
4. 자동 저장 기능 추가
5. 테스트 및 최적화