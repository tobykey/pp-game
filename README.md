# pp-game
Cherry Filter Pianissimo 체리필터 피아니시모 게임

## 실행
```
npm install
npm run dev
```
터미널에 표시된 `http://localhost:5173` 주소를 브라우저에서 엽니다.

- **장면 바로 가기:** 시작 화면의 "장면 바로 가기"에서 고르거나, 주소 뒤에 `?step=장면id`를 붙입니다. 예: `http://localhost:5173/?step=hook`
  - 챕터 0: `wake` 눈뜸, `whisper` 속삭임, `row` 노 젓기, `lamps` 등불 찾기, `hook` 훅, `reflect` 물그림자, `cloth` 천 조각, `chorus` 후렴 1 예고, `island` 섬, `end` 챕터 0 끝
  - 챕터 1: `c1sail` 간주 항해, `c1snap` 줄이 끊어짐, `c1room` 밤의 방, `c1stage` 빈 무대, `c1thorn` 첫 번째 가시, `c1rain` 비, `c1after` 여운
  - 챕터 2: `c2frozen` 멈춘 비, `c2echo` 빗방울 되받아 치기, `c2umbrella` 우산 아래, `c2guard` 쏟아지는 비, `c2resolve` Csus4 → C, `c2end` 챕터 2 끝
  - 챕터 3: `c3stall` 바람이 모자라다, `c3sail` 희망의 돛, `c3sea` 등대의 바다(카운터·F 폭발), `c3gate` F의 문과 A♭ 가시, `c3after` 바람을 안고
  - 챕터 4: `c4ebb` 물이 빠진다, `c4solo` 마른 바다(자유 솔로), `c4turn` 물이 돌아온다, `c4storm` 폭풍(가드·카운터), `c4clash` 격돌 ①(폭주 스트로크), `c4thorn` D♭ 가시, `c4after` D.S.
  - 챕터 5: `c5return` D.S., `c5other` 우산을 든 쪽, `c5creep` 다가오는 것, `c5natural` 제자리표(되받아 치기·시점 맞추기), `c5test` 붓글씨의 질문(기억 테스트), `c5truth` 잠든 건 나였다(쉼표), `c5rewrite` 고쳐 쓰는 글, `c5after` B♭
- **조작 요약:** 왼손 키로 코드, 오른손 마우스로 줄 긁기(다운 = 왼쪽 노, 업 = 오른쪽 노), Shift 팜뮤트, ← → 둘러보기(챕터 1부터), Esc 메뉴(일시정지·설정), 1–4 음색
- **이어하기:** 마지막으로 들어간 장면이 브라우저에 저장되어, 다음에 시작 화면에 "이어서" 버튼이 생깁니다

## 폴더 구조
| 폴더 | 내용 |
| --- | --- |
| `src/data/` | 곡 구성(`song.ts`), 코드, 편곡 모드, 챕터별 장면·배치·문구(`chapter0.ts` ~ `chapter5.ts`), 전체 장면 목록(`steps.ts`) |
| `src/story/` | 장면 진행 관리(`director.ts`), 챕터별 장면 진행(`chapter0.ts` ~ `chapter5.ts`) |
| `src/world/` | 게임 상태, 화면 배치, 매 프레임 갱신, 줄 튕기기, 박 시계·그루브(`rhythm.ts`), 노 젓기(`rowing.ts`) |
| `src/input/` | 마우스 드래그(오른손), 키보드 코드(왼손) |
| `src/audio/` | 기타 음색 합성(`engine.ts`), 심장·드럼·베이스(`kit.ts`) |
| `src/render/` | 캔버스 그리기, 수묵·이펙트 |
| `src/ui/` | HTML 화면 요소(목표 문구, 운지표, 배너, 붓글씨 안내) |
| `prototype/` | 원본 단일 HTML 프로토타입 (손맛 기준, 수정하지 않음) |
| `docs/` | 한눈에 보기(`overview.md`), 기획(`design.md`), 곡 구성표(`song-map.md`), 시나리오(`scenario-ch*.md`), 전체 이야기(`story.md`), 개발 일지(`devlog.md`), 확인할 것(`questions-for-toby.md`), 아이디어, 진행 보고서 |
| `guide/` | 플레이어용 안내서·홍보 페이지 (HTML + CSS). `npm run dev` 중이면 `http://localhost:5173/guide/` |
| `assets/` | 원곡 MR·악보 (로컬 전용, 저장소에 올리지 않음) |
