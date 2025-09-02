# EduContent 프롬프트 생성기 - 로컬 설치 가이드

이 문서는 로컬 컴퓨터에서 EduContent 프롬프트 생성기를 설치하고 실행하는 방법을 안내합니다.

## ✅ 사전 준비 사항

이 프로젝트를 실행하려면 컴퓨터에 다음과 같은 프로그램이 설치되어 있어야 합니다.

1.  **Node.js**: [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전을 다운로드하여 설치하세요. Node.js를 설치하면 패키지 관리자인 `npm`이 함께 설치됩니다.
2.  **Google Gemini API 키**:
    *   이 애플리케이션은 Google의 Gemini AI 모델을 사용합니다.
    *   [Google AI Studio](https://aistudio.google.com/app/apikey)에 방문하여 API 키를 발급받으세요. Google 계정만 있으면 무료로 받을 수 있습니다.

## ⚙️ 설치 및 실행 방법

### 1단계: 프로젝트 파일 다운로드

먼저 이 프로젝트의 모든 파일을 컴퓨터의 한 폴더 안에 다운로드(저장)합니다.

### 2단계: 필요한 라이브러리 설치

터미널(Windows의 경우 PowerShell 또는 CMD, macOS의 경우 Terminal)을 열고, 프로젝트 파일을 저장한 폴더로 이동한 후 다음 명령어를 실행하세요.

```bash
npm install
```

이 명령어는 `package.json` 파일에 명시된 모든 개발용 라이브러리(React, Vite 등)를 자동으로 다운로드하여 설치합니다.

### 3단계: API 키 설정

가장 중요한 단계입니다. 프로젝트의 최상위 폴더( `package.json` 파일이 있는 위치)에 `.env` 라는 이름의 새 파일을 만드세요.

그리고 그 파일 안에 다음과 같이 내용을 작성하세요.

```
VITE_API_KEY=여기에_발급받은_Gemini_API_키를_붙여넣으세요
```

**중요**: `여기에_발급받은_Gemini_API_키를_붙여넣으세요` 부분을 Google AI Studio에서 복사한 실제 API 키로 교체해야 합니다.

### 4단계: 개발 서버 실행

이제 모든 준비가 끝났습니다. 터미널에서 다음 명령어를 실행하여 로컬 개발 서버를 시작하세요.

```bash
npm run dev
```

서버가 성공적으로 실행되면 터미널에 다음과 유사한 메시지가 나타납니다.

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

이제 웹 브라우저를 열고 터미널에 나온 `Local` 주소(보통 `http://localhost:5173`)로 접속하면 애플리케이션을 사용할 수 있습니다.

---

궁금한 점이 있다면 이 문서를 다시 확인해주세요!
