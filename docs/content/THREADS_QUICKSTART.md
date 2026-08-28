# Threads 게시 Quick Start

## 1. 저장소에서 오늘 글 복사

터미널에서 프로젝트 폴더로 이동한 뒤 DAY 번호를 바꿔 실행합니다.

```bash
cd /Users/joelonsw/Desktop/tarot
pnpm threads:copy -- day-01 main
```

Threads 새 글 작성 화면에 `⌘V`로 붙여넣습니다.

## 2. 이미지 첨부

Finder에서 다음 폴더를 열고 같은 DAY의 PNG를 Threads에 끌어놓습니다.

```text
/Users/joelonsw/Desktop/tarot/public/threads/week-01/
```

예: `day-01.png`

## 3. 댓글 복사

게시한 글 아래에 댓글을 달 때는 한 번에 하나씩 실행합니다.

```bash
pnpm threads:copy -- day-01 comments
```

출력된 전체 내용을 붙여넣거나, 댓글을 분리해야 하면 `--print`로 터미널에서 확인한 뒤 번호별로 복사합니다. 마지막 CTA는 별도로 복사합니다.

```bash
pnpm threads:copy -- day-01 cta
```

`day-01`을 `day-02`부터 `day-07`로 바꾸면 해당 날짜 콘텐츠가 복사됩니다. 본문과 댓글 전체를 한 번에 확인하려면 `all`을 사용합니다.

```bash
pnpm threads:copy -- day-03 all --print
```

## 게시 순서

1. `main` 복사 → 본문에 붙여넣기
2. 같은 DAY의 PNG 첨부
3. 게시
4. `comments` 복사 → 결과 댓글로 붙여넣기
5. `cta` 복사 → 마지막 댓글로 붙여넣기
6. 게시 후 캘린더의 metrics에 수치 기록

이 도구는 Threads에 로그인하거나 자동 게시하지 않습니다. 클립보드에 텍스트만 넣고, 최종 게시 버튼은 직접 누릅니다.
