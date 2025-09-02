#!/bin/bash

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║     EduContent Prompt Generator - Installer         ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Node.js 확인
echo -e "${YELLOW}📋 시스템 요구사항 확인 중...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}   Node.js를 먼저 설치해주세요: https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo -e "${GREEN}✅ Node.js v${NODE_VERSION} 감지됨${NC}"

# npm 확인
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm v${NPM_VERSION} 감지됨${NC}"

# 의존성 설치
echo ""
echo -e "${YELLOW}📦 의존성 패키지 설치 중...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 패키지 설치 실패${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 패키지 설치 완료${NC}"

# OpenAI API 키 설정
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔑 OpenAI API 키 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "OpenAI API 키가 필요합니다."
echo "키를 얻는 방법: https://platform.openai.com/api-keys"
echo ""

# API 키 입력 받기
read -p "OpenAI API 키를 입력하세요 (sk-...): " API_KEY

# API 키 유효성 간단 체크
if [[ ! "$API_KEY" =~ ^sk-[a-zA-Z0-9-_]+$ ]]; then
    echo -e "${RED}❌ 유효하지 않은 API 키 형식입니다.${NC}"
    echo "   API 키는 'sk-'로 시작해야 합니다."
    exit 1
fi

# .env 파일 생성
echo "VITE_OPENAI_API_KEY=$API_KEY" > .env
echo -e "${GREEN}✅ API 키가 .env 파일에 저장되었습니다${NC}"

# 완료 메시지
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 설치가 완료되었습니다!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "프로그램을 시작하려면 다음 명령어를 실행하세요:"
echo ""
echo -e "${BLUE}  npm run dev${NC}"
echo ""
echo "브라우저에서 http://localhost:5555 로 접속하세요."
echo ""
echo -e "${YELLOW}⚠️  주의: .env 파일을 git에 커밋하지 마세요!${NC}"