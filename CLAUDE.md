# GWS Dashboard - Project Context

이 프로젝트는 [googleworkspace/cli](https://github.com/googleworkspace/cli)의 모든 기능을 웹 대시보드로 제공한다.

## 기술 스택
- Next.js 15 (App Router), TypeScript, Tailwind CSS
- NextAuth.js (Google OAuth), googleapis (Google API 클라이언트)
- 모든 API 호출은 `/api/google/*` 라우트를 통해 서버사이드에서 실행

## 프로젝트 구조
```
src/
├── app/
│   ├── page.tsx                     # 로그인 + 설정 마법사
│   ├── api/setup/                   # .env 자동 생성 API
│   ├── api/auth/[...nextauth]/      # OAuth
│   ├── api/google/{drive,gmail,calendar,sheets,docs,chat,admin}/
│   └── dashboard/{drive,gmail,calendar,sheets,docs,chat,admin}/
├── components/                      # Sidebar, Modal, PageHeader 등
└── lib/
    ├── auth.ts                      # NextAuth 설정 + OAuth scopes
    └── google.ts                    # googleapis 클라이언트 팩토리
```

## GWS CLI 전체 레퍼런스

아래는 이 대시보드가 커버해야 하는 CLI의 모든 기능이다.
상세 내용은 `docs/gws-cli-reference.md` 참조.

### 현재 구현 상태

| 서비스 | CLI 리소스 | 대시보드 구현 |
|--------|-----------|-------------|
| Drive | files, permissions, comments, revisions, drives, about | files (list, create, upload, delete) |
| Gmail | messages, labels, threads, drafts, settings | messages (list, get, send, trash), labels (list) |
| Calendar | events, calendarList, acl, freebusy | events (list, insert, delete) |
| Sheets | spreadsheets, values | list, get, values.get, values.append, create |
| Docs | documents | list, get, create, batchUpdate |
| Chat | spaces, messages, members, reactions | spaces.list, messages (list, create) |
| Admin | users, groups, members | users.list, groups.list, members.list |
| Slides | presentations, pages | 미구현 |
| Tasks | tasks, tasklists | 미구현 |
| People | contacts, contactGroups | 미구현 |
| Forms | forms, responses, watches | 미구현 |
| Keep | notes | 미구현 |
| Meet | conferences | 미구현 |
| Admin Reports | activities, usageReports | 미구현 |

### 미구현 기능 (기존 서비스 내)
- Drive: permissions CRUD, comments, revisions, shared drives, export, copy
- Gmail: threads, drafts, settings (filters, forwarding, vacation)
- Calendar: calendarList CRUD, ACL, freebusy, quickAdd, event update
- Sheets: batchUpdate, clear, sheets.copyTo
- Chat: reactions, space CRUD, member CRUD
- Admin: user/group CRUD (현재 읽기 전용)
