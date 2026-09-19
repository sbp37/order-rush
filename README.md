# 주문 폭주 식당 (Order Rush Diner)

Diner Dash 스타일의 한 화면 캐주얼 서빙 게임. 손님이 주문한 음식을 맞는 조리대에서 만들어 인내심이 다하기 전에 서빙하세요.

## 플레이 방법

1. 손님 머리 위 말풍선에 주문한 메뉴가 표시됩니다
2. 메뉴에 맞는 **조리대를 클릭**하면 조리 시작 (조리대 위 이모지 = 만드는 메뉴)
3. 조리가 끝나면 ✓ 링이 뜨고 모델이 완성 상태로 바뀝니다 — **다시 클릭해서 집기**
4. 같은 메뉴를 주문한 손님을 클릭하면 서빙 완료

- 빨리 서빙할수록 팁 +50%·콤보 보너스
- 인내심(말풍선 아래 게이지)이 다하면 손님이 나가고 😠 카운트 증가
- 한 판 = 90초 점심 러시

## 기술 스택

- Vite + React + TypeScript
- three.js (orthographic 아이소메트릭 뷰)
- WebAudio API 효과음 (별도 오디오 파일 없음)

## 개발

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```

## 크레딧

- 3D 모델: [kArchive](https://karchive.vibeline.co.kr) · 출처: 쓰레드 dogfooter
- 라이선스: 개인·상업 사용/수정 가능, AI 학습 가능, 원본 재판매 금지, 출처 표기 필수
