# Firebase 연결 현황

- 확인일: 2026-11-01 (한국 시간)
- 프로젝트 이름: app2
- 프로젝트 ID: app2-b1944
- 공식 콘솔: https://console.firebase.google.com/project/app2-b1944/overview
- 프로젝트 생성: 콘솔에서 준비 완료 및 대시보드 진입 확인
- 웹 앱: Busan PASS Rules Web 등록 시 콘솔 RPC 오류 발생, 생성 여부 미확인. 앱 목록 확인 전 재등록 금지.
- 이후 콘솔: 서비스 약관 동의 상태 로드 오류가 재시도 후에도 발생
- Authentication, Firestore, Storage: 설정·배포 미완료
- 원본 자료: 로컬 보존 중, Firebase 업로드 미완료
- 결제 연결 및 요금제 변경: 수행하지 않음

콘솔 접속 복구 후 기존 앱 목록을 먼저 확인하고 비공개 자료 저장 및 직원 인증 구성을 이어갑니다.

## 무료 전용 변경

- 2026-11-01 콘솔 Spark 무료($0/월) 확인. 결제 연결하지 않음.
- Cloud Storage 방식 폐기, Firestore 압축 분할 저장으로 코드 변경.
- 11개 테스트 통과, 자료 합계 9,901,201바이트 / 24개 조각.
- 실제 Firestore 생성·규칙 배포·자료 업로드는 미완료.
