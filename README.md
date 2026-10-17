# pp-game
Cherry Filter Pianissimo 체리필터 피아니시모 게임

## 실행
```
npm install
npm run dev
```
터미널에 표시된 `http://localhost:5173` 주소를 브라우저에서 엽니다.

## 폴더 구조
| 폴더 | 내용 |
| --- | --- |
| `src/data/` | 코드(화음)·편곡 모드·챕터 정의, 화면 문구 |
| `src/input/` | 마우스 드래그(오른손), 키보드 코드(왼손) |
| `src/audio/` | Web Audio 음색 합성 |
| `src/render/` | 캔버스 그리기, 수묵·이펙트 |
| `src/world/` | 게임 상태, 화면 배치, 매 프레임 갱신, 줄 튕기기 |
| `src/story/` | 챕터 퍼즐 진행 |
| `src/ui/` | HTML HUD(칩, 음색 버튼, 배너) |
| `prototype/` | 원본 단일 HTML 프로토타입 (손맛 기준, 수정하지 않음) |
| `docs/` | 기획 문서, 아이디어 보관함 |
