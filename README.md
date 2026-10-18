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
- **조작 요약:** 왼손 키로 코드, 오른손 마우스로 줄 긁기(다운 = 왼쪽 노, 업 = 오른쪽 노), Shift 팜뮤트, ← → 둘러보기(챕터 1부터), 1–4 음색
- **이어하기:** 마지막으로 들어간 장면이 브라우저에 저장되어, 다음에 시작 화면에 "이어서" 버튼이 생깁니다

## 폴더 구조
| 폴더 | 내용 |
| --- | --- |
| `src/data/` | 곡 구성(`song.ts`), 코드, 편곡 모드, 챕터별 장면·배치·문구(`chapter0.ts`, `chapter1.ts`), 전체 장면 목록(`steps.ts`) |
| `src/story/` | 장면 진행 관리(`director.ts`), 챕터별 장면 진행(`chapter0.ts`, `chapter1.ts`) |
| `src/world/` | 게임 상태, 화면 배치, 매 프레임 갱신, 줄 튕기기, 박 시계·그루브(`rhythm.ts`), 노 젓기(`rowing.ts`) |
| `src/input/` | 마우스 드래그(오른손), 키보드 코드(왼손) |
| `src/audio/` | 기타 음색 합성(`engine.ts`), 심장·드럼·베이스(`kit.ts`) |
| `src/render/` | 캔버스 그리기, 수묵·이펙트 |
| `src/ui/` | HTML 화면 요소(목표 문구, 운지표, 배너, 붓글씨 안내) |
| `prototype/` | 원본 단일 HTML 프로토타입 (손맛 기준, 수정하지 않음) |
| `docs/` | 한눈에 보기(`overview.md`), 기획(`design.md`), 곡 구성표(`song-map.md`), 시나리오(`scenario-ch0-1.md`), 아이디어, 진행 보고서 |
| `assets/` | 원곡 MR·악보 (로컬 전용, 저장소에 올리지 않음) |
