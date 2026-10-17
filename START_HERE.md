# 시작하기

## 1. 이 폴더 준비
1. GitHub에서 빈 저장소(`pp-game`, Private)를 만든다
2. VS Code에서 `Ctrl + Shift + P` → "Git: 복제(Clone)" → 저장소 주소 → 내 PC 폴더 선택
3. 받은 압축 파일의 내용(CLAUDE.md, START_HERE.md, docs, prototype)을 그 폴더에 그대로 넣는다

## 2. VS Code의 Claude Code에 처음 보낼 메시지 (복사해서 붙여넣기)

```
CLAUDE.md와 docs/design.md를 먼저 읽고, 지금까지의 기획과 프로토타입 상황을 5줄로 요약해줘.

그다음 1단계 작업:
prototype/pp-prototype.html의 조작감과 연출을 그대로 유지하면서,
Vite + TypeScript 프로젝트로 옮기고 CLAUDE.md의 모듈 구분대로 파일을 나눠줘.
.gitignore에는 node_modules와 오디오 원본 폴더(assets/audio-source/)를 넣어줘.

끝나면 npm run dev로 실행 방법을 알려주고, 원본 프로토타입과 똑같이 동작하는지
내가 확인할 항목을 목록으로 정리한 뒤 멈춰. 확인 전에는 커밋만 하고 다음 단계로 넘어가지 마.
```

## 3. 확인 후
- 잘 동작하면: "커밋하고 푸시해줘"
- 다음 단계: 챕터 0~1 장면 단위 시나리오 작성 → 버티컬 슬라이스 제작
