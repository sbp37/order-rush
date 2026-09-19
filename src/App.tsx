import { useEffect, useRef, useState } from 'react';
import { OrderRushGame, type HudState } from './game/game';
import { DISHES } from './game/config';
import './App.css';

const initialHud: HudState = {
  phase: 'ready',
  score: 0,
  combo: 0,
  timeLeft: 0,
  served: 0,
  missed: 0,
  holding: null,
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<OrderRushGame | null>(null);
  const [hud, setHud] = useState<HudState>(initialHud);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const game = new OrderRushGame(canvasRef.current!, overlayRef.current!, setHud);
    gameRef.current = game;
    game.init().then(() => setLoading(false));
    return () => game.dispose();
  }, []);

  const holdingDish = DISHES.find((d) => d.key === hud.holding);

  return (
    <div className="app">
      <canvas ref={canvasRef} className="game-canvas" />
      <div ref={overlayRef} className="overlay" />

      {hud.phase !== 'ready' && (
        <div className="hud">
          <div className="hud-chip score">💰 {hud.score.toLocaleString()}원</div>
          <div className="hud-chip">⏱ {Math.ceil(hud.timeLeft)}초</div>
          <div className="hud-chip">😠 {hud.missed}</div>
          {hud.combo > 1 && <div className="hud-chip combo">🔥 콤보 ×{hud.combo}</div>}
          {holdingDish && (
            <div className="hud-chip holding">
              들고 있음 {holdingDish.emoji} {holdingDish.name}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="screen">
          <h1 className="title">주문 폭주 식당</h1>
          <p className="subtitle">에셋 불러오는 중…</p>
        </div>
      )}

      {!loading && hud.phase === 'ready' && (
        <div className="screen">
          <h1 className="title">🍳 주문 폭주 식당</h1>
          <p className="subtitle">
            손님이 주문한 음식을 맞는 조리대에서 만들어 서빙하세요!
          </p>
          <div className="howto">
            <p>1️⃣ 조리대를 클릭하면 조리 시작 (조리대 위 이모지 = 만드는 메뉴)</p>
            <p>2️⃣ ✓ 표시가 뜨면 클릭해서 음식을 집어들기</p>
            <p>3️⃣ 같은 메뉴를 주문한 손님을 클릭하면 서빙 완료</p>
            <p>⏳ 손님 인내심이 다하면 나가버려요 — 빨리 서빙하면 팁 + 콤보!</p>
          </div>
          <button className="btn" onClick={() => gameRef.current?.start()}>
            점심 러시 시작 (90초)
          </button>
          <p className="credits">
            3D 모델: kArchive · 출처: 쓰레드 dogfooter
          </p>
        </div>
      )}

      {!loading && hud.phase === 'over' && (
        <div className="screen">
          <h1 className="title">🧾 오늘의 장사 마감</h1>
          <div className="result">
            <div className="result-row big">💰 {hud.score.toLocaleString()}원</div>
            <div className="result-row">🍽 서빙 {hud.served}개</div>
            <div className="result-row">😠 놓친 손님 {hud.missed}명</div>
          </div>
          <button className="btn" onClick={() => gameRef.current?.start()}>
            다시 영업하기
          </button>
          <p className="credits">
            3D 모델: kArchive · 출처: 쓰레드 dogfooter
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
