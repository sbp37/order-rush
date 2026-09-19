import { useEffect, useRef, useState } from 'react';
import { OrderRushGame, type HudState } from './game/game';
import { DISHES } from './game/config';
import './App.css';

const BEST_KEY = 'orderRushBest';

function gradeOf(score: number): string {
  return score >= 150000 ? 'S' : score >= 100000 ? 'A' : score >= 60000 ? 'B' : 'C';
}

const GRADE_COLORS: Record<string, string> = { S: '#ffd166', A: '#63d68a', B: '#7cc6fe', C: '#c8a8f0' };

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
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0));
  const [newRecord, setNewRecord] = useState(false);

  useEffect(() => {
    if (hud.phase === 'over' && hud.score > best) {
      setBest(hud.score);
      setNewRecord(hud.score > 0);
      localStorage.setItem(BEST_KEY, String(hud.score));
    } else if (hud.phase === 'over') {
      setNewRecord(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hud.phase]);

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
            <p>✌️ ×2 표시 손님은 메뉴 두 개를 주문해요 — 순서대로 두 번 서빙!</p>
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
          <div className="grade" style={{ color: GRADE_COLORS[gradeOf(hud.score)] }}>
            {gradeOf(hud.score)}
          </div>
          {newRecord && <div className="new-record">🎉 신기록!</div>}
          <div className="result">
            <div className="result-row big">💰 {hud.score.toLocaleString()}원</div>
            {best > 0 && <div className="result-row best">🏆 최고기록 {best.toLocaleString()}원</div>}
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
