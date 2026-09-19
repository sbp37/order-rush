# Test Plan 3 — meta/growth loop (ef6b510 + dfaec07) on devin/1789795054-polish

Env: Vite dev :5173, Chrome swiftshader. Game clock ~3-4× slow (90s≈5min real). Temp `__game` hook re-added (init+start, reverted at end) for state assertions + combo seeding + timeLeft shrink. Observer `__toasts` catches 1.1s popups; detune patch logs serve cents.

Code-derived expected values:
- Fever: combo≥4 → `fever`/`feverT=8`; popup "🔥 피버 타임!"; HUD chip "🔥 피버 타임 ×2"; `.app.fever` → orange inset glow; gain×2 while fever.
- VIP: ~12% spawn (+1%/day); body color 0xf6c945 metallic (palette never gold); patience×0.6; **tip×3** (tip only: gain=price+round(price*0.5*frac*3)+combo*500). NOTE: no 👑 in bubble code — spec says there should be one; verify visually.
- Day: `start()` from 'over' → day+1; HUD "📅 Day N" (purple chip); over screen "💰 오늘 매출"/"💵 통장 잔고"/"🛒 업그레이드 상점"/"▶️ Day N+1 영업 시작"; dayPatience ×0.94/day floor .55; spawn ×0.93/day floor .6; doubleChance +6%/day cap .6.
- Shop: 4 items; costs speed[15k,40k,90k] interior[12k,35k,80k] menu[20k,50k,110k] combo[18k,45k(MAX@Lv2)]; disabled iff money<cost or maxed; buy() → money−cost, Lv+1, sfx.buy.
- Faces: sprite at z=−0.3 now → faces toward camera at rotation.y=π.
- dispose() now removes pointerdown/pointermove.

## P1 — Day chip + faces (running round)
- PASS if HUD shows "📅 Day 1" chip and counter customers show visible faces (zoom) without any manipulation.

## P2 — VIP spawn + payout
- During round, dump `__game.customers[].vip`; when a VIP appears: zoom golden capsule; serve it.
- PASS if: vip customer exists with golden metallic body; serve popup ≈ price+tip*3+combo*500 (markedly bigger tip than normal customers at similar patience). Flag: bubble has NO 👑 (code gap vs spec).

## P3 — Fever trigger
- Set `__game.combo=3` via console, then do a REAL serve (any matching customer).
- PASS if: observer logs "🔥 피버 타임!" popup; DOM shows "🔥 피버 타임 ×2" chip; `document.querySelector('.app').className` includes 'fever'; screenshot shows orange edge glow; NEXT serve's popup ≈ 2× the formula value; fever ends ~8 game-s (chip+glow disappear).

## P4 — Game-over meta screen
- Shrink `__game.timeLeft=0.4` (or natural end) → over screen.
- PASS if: "💰 오늘 매출 N원", "💵 통장 잔고 N원" (= sum of gains, ≥ 매출 if multi-day later), "🛒 업그레이드 상점" button, "▶️ Day 2 영업 시작" button, grade/record rows still present.

## P5 — Shop
- Click 🛒 toggle → 4 items render (🔥화구 튜닝/🛋️인테리어/📋고급 메뉴판/⚡콤보 연습), each "Lv.0" + desc + cost.
- PASS if: items costing > 잔고 are disabled; clicking affordable 🛋️인테리어 (12,000) → 잔고 drops by 12,000 in the row AND state; item shows Lv.1 and cost 35,000원; re-click path disabled when unaffordable; toggle closes/reopens.

## P6 — Day 2 start + difficulty + persistence
- Click "▶️ Day 2 영업 시작" → PASS if: HUD "📅 Day 2", score 0원, ⏱ 90초, 잔고 persists (money = prev 잔고 − 12,000), upgrades kept (interior Lv.1 visible on next over / customers' maxPatience ≈ base×0.94(day)×1.15(interior)).
- Spot-check harder day: dump new customers' maxPatience vs day-1 equivalent (≈6% lower ×1.15 interior offset) or just record values.
