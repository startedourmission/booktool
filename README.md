# GWS Dashboard

Google Workspace의 모든 기능을 웹 대시보드에서 관리하세요.

[googleworkspace/cli](https://github.com/googleworkspace/cli)의 모든 기능을 직관적인 웹 UI로 제공합니다.

## 기능

| 서비스 | 기능 |
|--------|------|
| **Drive** | 파일 목록, 검색, 업로드, 폴더 생성, 삭제 |
| **Gmail** | 메일 목록, 읽기, 보내기(CC/BCC), 라벨 필터, 검색, 삭제 |
| **Calendar** | 일정 월별 보기, 생성(참석자/장소), 삭제 |
| **Sheets** | 스프레드시트 목록, 탭별 데이터 보기, 행 추가, 생성 |
| **Docs** | 문서 목록, 내용 보기, 텍스트 삽입, 생성 |
| **Chat** | 스페이스 목록, 메시지 보기/보내기 |
| **Admin** | 사용자 목록/검색, 그룹 목록, 멤버 조회 |

## 시작하기

### 1. Google Cloud 프로젝트 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. 다음 API를 활성화:
   - Google Drive API
   - Gmail API
   - Google Calendar API
   - Google Sheets API
   - Google Docs API
   - Google Chat API
   - Admin SDK API
3. **OAuth 2.0 클라이언트 ID** 생성 (웹 애플리케이션)
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 값을 입력:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=openssl-rand-base64-32-결과값
```

`NEXTAUTH_SECRET` 생성:
```bash
openssl rand -base64 32
```

### 3. 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 접속

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js** (Google OAuth)
- **googleapis** (Google API 클라이언트)
