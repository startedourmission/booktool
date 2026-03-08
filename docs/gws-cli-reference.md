# GWS CLI 전체 커맨드 레퍼런스

`gws`는 Google Workspace의 모든 API를 하나의 CLI로 제공하는 도구다.
커맨드 패턴: `gws <service> <resource> <method> [flags]`

---

## 글로벌 플래그

| 플래그 | 설명 |
|--------|------|
| `--params <JSON>` | URL/쿼리 파라미터 (JSON 객체) |
| `--json <JSON>` | 요청 바디 (JSON) |
| `--dry-run` | 요청 미리보기 (실행 안 함) |
| `--upload <PATH>` | 파일 업로드 (multipart) |
| `--output <PATH>`, `-o` | 응답을 파일로 저장 |
| `--page-all` | 전체 페이지네이션 (NDJSON 출력) |
| `--page-limit <N>` | 최대 페이지 수 (기본 10) |
| `--page-delay <MS>` | 페이지 간 딜레이 (기본 100ms) |
| `--format <FORMAT>` | 출력 형식: `json`, `table`, `yaml`, `csv` |
| `--sanitize <TEMPLATE>` | Model Armor 템플릿 |

---

## 인증

```bash
gws auth setup                    # GCP 프로젝트 + OAuth 클라이언트 자동 설정
gws auth login                    # 브라우저로 OAuth 인증
gws auth login -s drive,gmail     # 특정 서비스만 scope 지정
gws auth login --readonly         # 읽기 전용 scope
gws auth login --full             # 전체 scope (pubsub + cloud-platform 포함)
gws auth status                   # 인증 상태 확인
gws auth export --unmasked        # 자격증명 출력 (CI/CD용)
gws auth logout                   # 로그아웃
```

환경변수 우선순위:
1. `GOOGLE_WORKSPACE_CLI_TOKEN` (액세스 토큰)
2. `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` (JSON 파일 경로)
3. `gws auth login` 으로 저장된 암호화 자격증명
4. `~/.config/gws/credentials.json`

---

## 스키마 조회

```bash
gws schema drive.files.list              # 메서드 상세 (HTTP, 파라미터, scope)
gws schema drive.File                    # 타입 정의
gws schema drive.File --resolve-refs     # $ref 재귀 해석
```

---

## Drive

리소스: `files`, `permissions`, `comments`, `replies`, `revisions`, `drives`, `about`, `changes`, `channels`, `apps`

```bash
# 파일 목록
gws drive files list --params '{"pageSize": 10}'
gws drive files list --page-all --format table

# 파일 상세
gws drive files get --params '{"fileId": "ID"}'

# 파일 생성 + 업로드
gws drive files create --json '{"name": "report.pdf"}' --upload ./report.pdf

# 폴더 생성
gws drive files create --json '{"name": "NewFolder", "mimeType": "application/vnd.google-apps.folder"}'

# 파일 복사
gws drive files copy --params '{"fileId": "ID"}' --json '{"name": "Copy of File"}'

# 파일 내보내기 (Google 문서 → PDF 등)
gws drive files export --params '{"fileId": "ID", "mimeType": "application/pdf"}' -o output.pdf

# 파일 다운로드
gws drive files get --params '{"fileId": "ID", "alt": "media"}' -o downloaded.pdf

# 파일 삭제
gws drive files delete --params '{"fileId": "ID"}'

# 휴지통 비우기
gws drive files emptyTrash

# 파일 업데이트 (이름 변경 등)
gws drive files update --params '{"fileId": "ID"}' --json '{"name": "New Name"}'

# 공유 권한 관리
gws drive permissions list --params '{"fileId": "ID"}'
gws drive permissions create --params '{"fileId": "ID"}' --json '{"role": "reader", "type": "user", "emailAddress": "user@example.com"}'
gws drive permissions delete --params '{"fileId": "ID", "permissionId": "PERM_ID"}'

# 댓글
gws drive comments list --params '{"fileId": "ID"}'
gws drive comments create --params '{"fileId": "ID"}' --json '{"content": "Good job!"}'

# 리비전
gws drive revisions list --params '{"fileId": "ID"}'

# 공유 드라이브
gws drive drives list
gws drive drives create --json '{"name": "Team Drive"}'

# 저장 용량
gws drive about get --params '{"fields": "user,storageQuota"}'

# 변경사항 감시
gws drive changes getStartPageToken
gws drive changes list --params '{"pageToken": "TOKEN"}'
```

---

## Gmail

리소스: `users.messages`, `users.labels`, `users.threads`, `users.drafts`, `users.settings`, `users.history`

```bash
# 프로필
gws gmail users getProfile --params '{"userId": "me"}'

# 메시지 목록
gws gmail users.messages list --params '{"userId": "me", "maxResults": 10}'
gws gmail users.messages list --params '{"userId": "me", "q": "is:unread from:boss@example.com"}'

# 메시지 읽기
gws gmail users.messages get --params '{"userId": "me", "id": "MSG_ID"}'
gws gmail users.messages get --params '{"userId": "me", "id": "MSG_ID", "format": "raw"}'

# 메시지 보내기
gws gmail users.messages send --params '{"userId": "me"}' --json '{"raw": "BASE64_ENCODED"}'

# 메시지 수정 (라벨 추가/제거)
gws gmail users.messages modify --params '{"userId": "me", "id": "MSG_ID"}' --json '{"addLabelIds": ["STARRED"]}'

# 휴지통
gws gmail users.messages trash --params '{"userId": "me", "id": "MSG_ID"}'
gws gmail users.messages untrash --params '{"userId": "me", "id": "MSG_ID"}'

# 영구 삭제
gws gmail users.messages delete --params '{"userId": "me", "id": "MSG_ID"}'

# 라벨
gws gmail users.labels list --params '{"userId": "me"}'
gws gmail users.labels create --params '{"userId": "me"}' --json '{"name": "MyLabel"}'
gws gmail users.labels update --params '{"userId": "me", "id": "LABEL_ID"}' --json '{"name": "NewName"}'
gws gmail users.labels delete --params '{"userId": "me", "id": "LABEL_ID"}'

# 스레드
gws gmail users.threads list --params '{"userId": "me", "q": "is:unread"}'
gws gmail users.threads get --params '{"userId": "me", "id": "THREAD_ID"}'

# 설정
gws gmail users.settings getVacation --params '{"userId": "me"}'
gws gmail users.settings updateVacation --params '{"userId": "me"}' --json '{"enableAutoReply": true, "responseSubject": "OOO", "responseBodyPlainText": "I am on vacation"}'

# 필터
gws gmail users.settings.filters list --params '{"userId": "me"}'
gws gmail users.settings.filters create --params '{"userId": "me"}' --json '{"criteria": {"from": "noreply@example.com"}, "action": {"addLabelIds": ["TRASH"]}}'

# 히스토리 (변경 추적)
gws gmail users.history list --params '{"userId": "me", "startHistoryId": "12345"}'
```

---

## Calendar

리소스: `events`, `calendarList`, `calendars`, `acl`, `freebusy`, `colors`, `settings`

```bash
# 이벤트 목록
gws calendar events list --params '{"calendarId": "primary", "maxResults": 10, "timeMin": "2026-03-08T00:00:00Z"}'

# 이벤트 생성
gws calendar events insert --params '{"calendarId": "primary"}' --json '{
  "summary": "팀 미팅",
  "start": {"dateTime": "2026-03-09T10:00:00+09:00"},
  "end": {"dateTime": "2026-03-09T11:00:00+09:00"},
  "attendees": [{"email": "user@example.com"}],
  "location": "회의실 A"
}'

# 빠른 추가
gws calendar events quickAdd --params '{"calendarId": "primary", "text": "내일 오후 2시 점심 약속"}'

# 이벤트 수정
gws calendar events update --params '{"calendarId": "primary", "eventId": "EVENT_ID"}' --json '{"summary": "수정된 제목"}'

# 이벤트 이동 (다른 캘린더로)
gws calendar events move --params '{"calendarId": "primary", "eventId": "EVENT_ID", "destination": "other@group.calendar.google.com"}'

# 이벤트 삭제
gws calendar events delete --params '{"calendarId": "primary", "eventId": "EVENT_ID"}'

# 캘린더 목록
gws calendar calendarList list

# 빈 시간 조회
gws calendar freebusy query --json '{
  "timeMin": "2026-03-08T00:00:00Z",
  "timeMax": "2026-03-09T00:00:00Z",
  "items": [{"id": "primary"}]
}'

# 캘린더 ACL (접근 권한)
gws calendar acl list --params '{"calendarId": "primary"}'
gws calendar acl insert --params '{"calendarId": "primary"}' --json '{"role": "reader", "scope": {"type": "user", "value": "user@example.com"}}'

# 색상 목록
gws calendar colors get
```

---

## Sheets

리소스: `spreadsheets`, `spreadsheets.values`, `spreadsheets.sheets`, `spreadsheets.developerMetadata`

```bash
# 스프레드시트 생성
gws sheets spreadsheets create --json '{"properties": {"title": "Q1 리포트"}}'

# 스프레드시트 정보
gws sheets spreadsheets get --params '{"spreadsheetId": "ID"}'

# 값 읽기
gws sheets spreadsheets.values get --params '{"spreadsheetId": "ID", "range": "Sheet1!A1:D10"}'

# 여러 범위 읽기
gws sheets spreadsheets.values batchGet --params '{"spreadsheetId": "ID", "ranges": ["Sheet1!A1:B5", "Sheet2!A1:C3"]}'

# 값 쓰기
gws sheets spreadsheets.values update --params '{"spreadsheetId": "ID", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' --json '{"values": [["Hello", "World"], ["Foo", "Bar"]]}'

# 행 추가 (append)
gws sheets spreadsheets.values append --params '{"spreadsheetId": "ID", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' --json '{"values": [["New", "Row"]]}'

# 값 지우기
gws sheets spreadsheets.values clear --params '{"spreadsheetId": "ID", "range": "Sheet1!A1:D10"}'

# 시트 구조 변경 (행/열 추가, 시트 추가 등)
gws sheets spreadsheets batchUpdate --params '{"spreadsheetId": "ID"}' --json '{
  "requests": [
    {"addSheet": {"properties": {"title": "NewSheet"}}},
    {"appendDimension": {"sheetId": 0, "dimension": "ROWS", "length": 10}}
  ]
}'

# 시트 복사
gws sheets spreadsheets.sheets copyTo --params '{"spreadsheetId": "SOURCE_ID", "sheetId": 0}' --json '{"destinationSpreadsheetId": "DEST_ID"}'
```

---

## Docs

리소스: `documents`

```bash
# 문서 생성
gws docs documents create --json '{"title": "새 문서"}'

# 문서 읽기
gws docs documents get --params '{"documentId": "DOC_ID"}'

# 문서 편집 (batchUpdate)
gws docs documents batchUpdate --params '{"documentId": "DOC_ID"}' --json '{
  "requests": [
    {"insertText": {"location": {"index": 1}, "text": "첫 번째 줄\n"}},
    {"updateTextStyle": {
      "range": {"startIndex": 1, "endIndex": 8},
      "textStyle": {"bold": true},
      "fields": "bold"
    }}
  ]
}'
```

---

## Slides

리소스: `presentations`, `presentations.pages`

```bash
gws slides presentations create --json '{"title": "새 프레젠테이션"}'
gws slides presentations get --params '{"presentationId": "PRES_ID"}'
gws slides presentations.pages getThumbnail --params '{"presentationId": "PRES_ID", "pageObjectId": "PAGE_ID"}'
gws slides presentations batchUpdate --params '{"presentationId": "PRES_ID"}' --json '{"requests": [...]}'
```

---

## Chat

리소스: `spaces`, `spaces.messages`, `spaces.members`, `spaces.messages.reactions`

```bash
# 스페이스 목록
gws chat spaces list

# 스페이스 생성
gws chat spaces create --json '{"displayName": "Project Alpha", "spaceType": "SPACE"}'

# DM 찾기
gws chat spaces findDirectMessage --params '{"name": "users/USER_ID"}'

# 메시지 보내기
gws chat spaces.messages create --params '{"parent": "spaces/SPACE_ID"}' --json '{"text": "안녕하세요!"}'

# 메시지 목록
gws chat spaces.messages list --params '{"parent": "spaces/SPACE_ID"}'

# 메시지 삭제
gws chat spaces.messages delete --params '{"name": "spaces/SPACE_ID/messages/MSG_ID"}'

# 리액션
gws chat spaces.messages.reactions create --params '{"parent": "spaces/SPACE_ID/messages/MSG_ID"}' --json '{"emoji": {"unicode": "👍"}}'

# 멤버 관리
gws chat spaces.members list --params '{"parent": "spaces/SPACE_ID"}'
gws chat spaces.members create --params '{"parent": "spaces/SPACE_ID"}' --json '{"member": {"name": "users/USER_ID", "type": "HUMAN"}}'
```

---

## Tasks

리소스: `tasklists`, `tasks`

```bash
gws tasks tasklists list
gws tasks tasklists insert --json '{"title": "업무 목록"}'
gws tasks tasks list --params '{"tasklist": "TASKLIST_ID"}'
gws tasks tasks insert --params '{"tasklist": "TASKLIST_ID"}' --json '{"title": "장보기", "due": "2026-03-10T00:00:00Z"}'
gws tasks tasks update --params '{"tasklist": "TASKLIST_ID", "task": "TASK_ID"}' --json '{"status": "completed"}'
gws tasks tasks delete --params '{"tasklist": "TASKLIST_ID", "task": "TASK_ID"}'
```

---

## People (Contacts)

리소스: `people`, `people.connections`, `contactGroups`

```bash
gws people people get --params '{"resourceName": "people/me", "personFields": "names,emailAddresses,phoneNumbers"}'
gws people people.connections list --params '{"resourceName": "people/me", "personFields": "names,emailAddresses", "pageSize": 50}'
gws people people createContact --json '{"names": [{"givenName": "John", "familyName": "Doe"}], "emailAddresses": [{"value": "john@example.com"}]}'
gws people people searchDirectoryPeople --params '{"query": "john", "readMask": "names,emailAddresses", "sources": ["DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE"]}'
gws people contactGroups list
```

---

## Forms

리소스: `forms`, `forms.responses`, `forms.watches`

```bash
gws forms forms create --json '{"info": {"title": "설문조사"}}'
gws forms forms get --params '{"formId": "FORM_ID"}'
gws forms forms.responses list --params '{"formId": "FORM_ID"}'
```

---

## Keep

리소스: `notes`

```bash
gws keep notes list
gws keep notes get --params '{"name": "notes/NOTE_ID"}'
gws keep notes create --json '{"body": {"text": {"text": "메모 내용"}}}'
```

---

## Meet

리소스: `conferenceRecords`, `spaces`

```bash
gws meet spaces create --json '{"config": {"accessType": "OPEN"}}'
```

---

## Admin Reports

리소스: `activities`, `customerUsageReports`, `userUsageReport`

```bash
gws admin-reports activities list --params '{"userKey": "all", "applicationName": "login"}'
gws admin-reports customerUsageReports get --params '{"date": "2026-03-01"}'
gws admin-reports userUsageReport get --params '{"userKey": "all", "date": "2026-03-01"}'
```

---

## 출력 포맷

| 포맷 | 플래그 | 설명 |
|------|--------|------|
| JSON | `--format json` (기본) | Pretty-print, 페이지네이션 시 NDJSON |
| Table | `--format table` | 텍스트 테이블, 중첩 객체는 dot-notation |
| YAML | `--format yaml` | YAML 출력 |
| CSV | `--format csv` | RFC CSV |

---

## AI 에이전트 스킬 (89개)

서비스별 스킬: `gws-drive`, `gws-gmail`, `gws-gmail-send`, `gws-gmail-triage`, `gws-calendar`, `gws-sheets`, `gws-docs`, `gws-chat` 등
워크플로우: `email-to-task`, `file-announce`, `meeting-prep`, `standup-report`, `weekly-digest`
페르소나: `executive-assistant`, `project-manager`, `it-admin` 등 10개 역할 번들

```bash
npx skills add https://github.com/googleworkspace/cli
```
