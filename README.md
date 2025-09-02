# EduContent Prompt Generator

AI를 활용한 교육 콘텐츠 프롬프트 생성 도구

## 🚀 빠른 시작

### 자동 설치 (권장)

```bash
# 저장소 클론
git clone https://github.com/jjhmonolith/htmlpromtgen.git
cd htmlpromtgen

# 설치 스크립트 실행
./install.sh
```

설치 스크립트가 자동으로:
- Node.js 환경 확인
- 의존성 패키지 설치
- OpenAI API 키 설정
- 환경 변수 파일 생성

### 수동 설치

```bash
# 1. 저장소 클론
git clone https://github.com/jjhmonolith/htmlpromtgen.git
cd htmlpromtgen

# 2. 패키지 설치
npm install

# 3. 환경 변수 설정
echo "VITE_OPENAI_API_KEY=your-api-key-here" > .env

# 4. 개발 서버 실행
npm run dev
```

## 📋 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- OpenAI API 키 ([여기서 발급](https://platform.openai.com/api-keys))

## ✨ 주요 기능

- **5단계 생성 프로세스**: 체계적인 교육 콘텐츠 생성
- **비주얼 아이덴티티**: AI 기반 디자인 시스템 자동 생성
- **페이지 레이아웃**: 각 페이지별 맞춤형 레이아웃 제안
- **애니메이션 효과**: 학습 몰입도를 높이는 동적 효과
- **페이지 독립성**: 각 HTML 페이지는 완전히 독립적으로 작동
- **최소 폰트 크기**: 가독성을 위한 18pt 이상 강제

## 🛠 기술 스택

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-5 API
- **Build**: Vite

## 📝 사용법

1. 프로젝트 정보 입력 (제목, 대상, 페이지 구성)
2. AI가 생성한 비주얼 아이덴티티 확인
3. 각 페이지별 레이아웃 제안 검토 및 수정
4. 애니메이션 및 상호작용 효과 추가
5. 최종 프롬프트 생성 및 복사

## ⚠️ 주의사항

- `.env` 파일은 절대 git에 커밋하지 마세요
- API 키는 안전하게 관리하세요
- 프로덕션 환경에서는 백엔드 프록시 사용을 권장합니다

## 📄 라이선스

MIT