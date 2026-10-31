# 부산광역시사회서비스원 규정사전

첨부한 기관 자료를 실제로 추출해 검색하는 웹앱입니다. 첫 화면은 공식 기관 로고와 검색창 중심으로 구성했습니다.

## 실행

Node.js 22 이상 설치 후 이 폴더에서 `npm install` → `npm start`를 실행합니다. 브라우저에서 http://127.0.0.1:4173 을 엽니다. 로컬 미리보기는 같은 컴퓨터의 루프백 접속만 허용합니다. `public/index.html`을 직접 더블클릭하는 방식은 API 검색이 작동하지 않습니다.

`npm test`로 검색 우선순위, 금액 근거, 연도 분리, 인증 차단을 검사합니다.

## 현재 제공 기능

- 5개 자료: 규정집 PDF 622쪽, 2027 지침 PDF 146쪽, HWP 3개 파일 본문을 1,082개 검색 구간으로 추출.
- 내부규정 우선 검색, 검색어 강조, 규정명·조문·페이지 표시, 원본 열기.
- PDF 수록 조례를 내부규정에서 분리. 규정집 목차 57개 항목을 규정명 매핑에 사용.
- 2026/2027년 예산편성지침 구분. 시행일을 알 수 없으면 미확인으로 표시.
- 심사수당 원문 대조 해설, 지급 조건, 한도 계산, 5개 근거 페이지.
- 관련 법령·지침은 별도 접이식 영역. 검증되지 않은 외부 자료는 참고자료로 표시.
- Firebase Google 로그인 및 Firestore 직원 승인 목록 검증 코드. 인증 미설정 배포는 검색·원본 API 접근 차단.
- 선택적 Tavily 공식 도메인 검색 연동. 미연결/장애를 사용자에게 표시.

## 아직 연결·검수가 필요한 범위

현재 검색은 모델 재학습이 아니라 등록 원문 검색입니다. 생성형 AI 해설은 연결하지 않았으며, 심사수당 외 검색어는 관련 원문 구간을 제시합니다. 전체 규정의 해설, 정확한 조문 경계 분할, 모든 준용 관계, 상위 법령 충돌의 자동 판정은 구현·검증 완료 상태가 아닙니다.

HWP 문단 레코드에서 글자를 추출했습니다. 표 병합 셀·그림·캡처 이미지는 완전하게 해석되지 않습니다. 특히 사업비 결의서 매뉴얼의 화면 캡처는 원본 대조와 OCR 검수가 남아 있습니다. 빈 텍스트 PDF 페이지는 추출 현황에 공개합니다. 규정집의 저텍스트 페이지 10개는 표지·공백·쪽 번호 페이지임을 렌더링으로 확인했습니다.

규정집 이름의 260929는 파일명이며, 모든 수록 규정의 시행일이라는 뜻이 아닙니다. 예산연도 필터는 지침 선택용이며 과거 내부규정 재구성 기능이 아닙니다.

## GitHub → Vercel → Firebase (무료 Spark 전용)

Firebase 프로젝트: `app2-b1944`. 2026-11-01 콘솔에서 **Spark 무료($0/월)** 확인.

1. 공개 GitHub에는 코드만 업로드합니다. `data/`, `.env`, 비밀키는 Git 추적에서 제외합니다.
2. Firebase는 Spark 요금제를 유지하고 결제 계정을 연결하지 않습니다. Cloud Storage, Cloud Functions, App Hosting, Extensions, SMS 인증, 유료 AI 기능을 사용하지 않습니다. 예산 알림은 과금 차단 장치가 아닙니다.
3. Firestore Standard의 기본 데이터베이스 1개와 Google 로그인을 사용합니다. Firestore와 직원 인증 설정은 실제 콘솔에서 아직 완료되지 않았습니다.
4. `firebase deploy --only firestore --project app2-b1944`로 클라이언트 접근 차단 규칙과 바이너리 필드 인덱스 제외 설정을 배포합니다. 다른 프로젝트 규칙을 덮어쓰지 않습니다.
5. 원문과 색인을 gzip 압축하여 480 KiB 이하의 Firestore 문서로 분할합니다. 현재 자료는 압축 합계 9,901,201바이트·24개 조각입니다. 원본 복원 시 SHA-256과 크기를 확인합니다. 소량의 정적 문서용이며 대용량 파일 저장 서비스가 아닙니다.
6. 서버 환경변수 `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_WEB_CONFIG`를 안전하게 설정합니다. 서비스 계정 비밀키는 서버에서만 사용합니다.
7. 콘솔에서 Spark 상태를 확인한 뒤 관리자 로컬 환경에 `FIREBASE_SPARK_CONFIRMED=true`를 설정하고 `node --env-file=.env scripts/upload-private-data.mjs`를 실행합니다. 이 변수는 확인 기록이며 요금제를 강제로 잠그거나 실제 결제 상태를 조회하는 기능은 아닙니다. `--dry-run`은 업로드 없이 크기와 조각 수만 검사합니다.
8. Firestore `employees/{Firebase UID}`에 승인된 직원의 `enabled: true`를 설정합니다. 이메일 검증이 된 승인 계정만 서버를 통해 자료에 접근합니다.
9. Vercel은 Other / Output Directory `public` 설정으로 별도 배포합니다. Vercel 및 외부 검색·AI 서비스의 비용과 이용조건은 Firebase 무료 정책과 별개입니다. 현재 외부 검색·AI 유료 키는 연결하지 않았습니다.

한도 초과 시 추가 과금 대신 사용이 제한되는 Spark를 유지합니다. 앱은 Firestore 한도 오류를 429 안내로 처리하고 요금제를 변경하지 않습니다. 서버 인스턴스별 색인 캐시로 읽기를 줄이지만 무제한 가용성을 보장하지 않습니다. 자료 버전이 쌓이면 용량이 증가하므로 이전 비활성 버전은 별도 검수 후 정리해야 합니다. 사용자 또는 프로젝트 관리자가 결제를 연결하거나 Google 정책이 변경되면 재검토가 필요합니다.

GitHub 반영·기존 원문 이력 제거, 실제 Firestore 생성·업로드, 직원 로그인, Vercel 배포는 아직 완료되지 않았습니다.

공식 기준:
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- https://firebase.google.com/docs/firestore/quotas

## 자료 갱신

`scripts/ingest.py`의 파일 목록과 SOURCE 경로를 수정한 후 pypdf·olefile이 있는 Python으로 실행하고 `scripts/enrich.py`를 실행합니다. 규정집 페이지 매핑(현재 인쇄쪽 + 8 = PDF쪽), 심사수당 해설 및 테스트를 반드시 재검수하세요. 재추출은 corpus의 answers/curatedPages를 초기화하므로 검수된 해설을 비공개 자료에 복원해야 합니다. 원본 SHA-256과 추출 현황은 `data/corpus.json`에 보관합니다. 원문 파일 내용을 코드나 명령으로 실행하지 않습니다.

## 주요 파일

- `public/`: 화면, 공식 로고, 브라우저 코드
- `api/index.mjs`: Vercel 공용 API 진입점
- `lib/search.mjs`: 내부규정 우선 검색 및 검수된 해설
- `lib/auth.mjs`: Firebase 인증 및 직원 승인 검증
- `lib/external.mjs`: 공식 도메인 외부 검색
- `data/`: 로컬 전용 검색 색인, 추출본, 등록 원본 (Git 추적 제외)
- `lib/data.mjs`: 인증 후 비공개 Firestore 자료 읽기
- `firestore.indexes.json`: 바이너리 필드 인덱스 제외
- `scripts/`: 재현 가능한 추출·매핑·PDF 검수 도구
- `tests/`: 의미 있는 검색·인증 회귀 검사

공식 로고 출처: https://busan.pass.or.kr/img/common/logo.png
