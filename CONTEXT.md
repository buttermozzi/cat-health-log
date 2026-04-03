# 고양이 건강기록 앱 — 프로젝트 맥락 (Claude Code용)

## 프로젝트 개요
- 웹개발자 → PO 직무전환을 위한 사이드 프로젝트 포트폴리오
- 목표: 8주 플랜으로 PO 역량 (PRD · User Flow · MVP · 파일럿 테스트 · Iterative Release) 경험
- 참고 채용공고: 헬스케어 AI 서비스 기획 (프로덕트 매니저)

---

## 서비스 개요
고양이를 키우는 직장인 집사를 위한 건강/행동 기록 앱

### 핵심 문제
- 증상 발생 시 "병원 가야 하는지" 판단 어려움
- 병원 방문 시 "언제부터 이랬는지" 히스토리 전달 어려움
- 기존 앱은 입력 허들이 높아 기록 자체를 포기하게 됨

### 핵심 원칙
- 기록 1회 = 3탭 이내 완료
- 불안 자극 대신 따뜻한 톤 ("오늘도 잘 봐줬어요 🐱")

---

## 기술 스택
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend/DB: Supabase
- 배포 예정: Vercel
- PWA 설정 예정 (아침/저녁 푸시 알림)

---

## DB 스키마

```sql
-- 고양이 프로필
cats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
)

-- 기록
records (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid references cats(id) on delete cascade not null,
  recorded_at date not null default current_date,
  health_status text not null,
  -- 값: 'good' | 'appetite_loss' | 'active' | 'abnormal' | 'lethargy' | 'vomit' | 'behavior_change'
  play_count int default 0,
  memo text,
  photo_url text,
  created_at timestamptz default now()
)
```

### RLS 정책
- cats: `user_id = auth.uid()` (FOR ALL) — 활성화 완료
- records: `cat_id IN (SELECT id FROM cats WHERE user_id = auth.uid())` (FOR ALL) — 활성화 완료

---

## 현재 진행 상태

### 완료된 작업
- [x] 1주차: 문제 정의 · 유저 리서치 · PRD v1.1
- [x] 2주차: User Flow · 서비스 시나리오 · 와이어프레임 (HTML)
- [x] 3주차 전반: 가설 3개 · Impact vs Effort 매트릭스
- [x] Next.js + Supabase 프로젝트 세팅
- [x] DB 테이블 생성 (cats, records)
- [x] records insert 에러 해결
- [x] 홈 화면 (app/page.tsx)
- [x] 기록 입력 화면 (app/record/page.tsx)
- [x] 타임라인 화면 (app/timeline/page.tsx)
- [x] 병원 리포트 화면 (app/report/page.tsx)
- [x] Supabase Auth 로그인 구현 (이메일 OTP)
  - middleware.ts — 세션 유지 + 미인증 라우트 보호
  - app/login/page.tsx — 이메일 → OTP 2단계 로그인
  - app/onboarding/page.tsx — 첫 로그인 후 고양이 이름 등록
- [x] RLS 활성화 (cats, records)

### 다음 작업 (순서대로)
1. PWA 설정 + 푸시 알림
2. Vercel 배포

---

## 화면 구조 (와이어프레임 기준)

| 화면 | 경로 | 핵심 구성 |
|------|------|-----------|
| 홈 | / | 오늘 기록 현황 + 기록하기 버튼 + 최근 이상 증상 |
| 기록 입력 | /record | 건강상태 선택 + 놀이횟수 선택 + 메모(선택) |
| 타임라인 | /timeline | 날짜별 기록 히스토리 + 이번달 요약 |
| 리포트 | /report | 기간선택 + 증상요약 + 카카오톡 공유 / PDF 저장 |

---

## PRD 핵심 기능 (MoSCoW)

### Must Have
- 원터치 상태 기록 (건강상태 버튼형)
- 놀이 횟수 기록 (0/1/2/3회+)
- 날짜별 타임라인
- 병원 리포트 생성
- 아침/저녁 기록 알림 (PWA Push)

### Should Have
- 행동 해석 가이드
- 사진 첨부
- 다묘 가정 지원

### Won't Have (이번 버전)
- 놀이 목표 횟수 관리 (의사결정: 기록 허들 최소화 원칙과 충돌)
- 수의사 직접 상담
- 커뮤니티 기능

---

## 8주 플랜 현황

| 주차 | 내용 | 상태 |
|------|------|------|
| 1주차 | 문제정의 · 유저리서치 · PRD | ✅ 완료 |
| 2주차 | User Flow · 와이어프레임 | ✅ 완료 |
| 3주차 | 가설 · 매트릭스 · 개발 · Auth · RLS | ✅ 완료 |
| 4주차 | 백로그 · 스프린트 · MVP 배포 | 예정 |
| 5주차 | 파일럿 테스트 · GA 분석 | 예정 |
| 6주차 | A/B 테스트 설계 · 1차 개선 | 예정 |
| 7주차 | 경쟁 서비스 분석 · 2차 개선 | 예정 |
| 8주차 | 회고 · 포트폴리오 완성 | 예정 |
