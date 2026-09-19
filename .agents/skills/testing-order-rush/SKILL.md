---
name: testing-order-rush
description: How to run and end-to-end test the 주문 폭주 식당 (Order Rush Diner) three.js game in this VM's Chrome
---

# Testing 주문 폭주 식당 (Order Rush Diner)

## Dev server
- `npm run dev -- --port 5173` from `/home/ubuntu/repos/order-rush` (Vite, no build needed). GLBs are local in `public/models/`, served at `/models/<id>.glb`.

## Browser / WebGL gotchas
- Use Chrome for Testing with software WebGL: `--disable-gpu --enable-unsafe-swiftshader` (or `--use-angle=swiftshader-webgl`) and `--remote-debugging-port=29229`. Without these the canvas renders blank.
- Emoji need `~/.fonts/NotoColorEmoji.ttf` + `fc-cache`, else tofu boxes in HUD/bubbles.

## Game clock vs wall clock — IMPORTANT
- The game loop caps `dt` at 0.1s per frame. Under swiftshader the page renders ~10-20 FPS, so **game time runs ~2-4x slower than wall clock**: the "90초" round takes ~5 real minutes, and cook times (4-6 game-sec) take ~10-25s real. Budget waits accordingly; never assume 1:1 timing.

## Click targets (1024x768 screenshot space, maximized window)
- Station row (top of scene, z≈-1.1): noodle🍜 ~(305,280), fryer🍗 ~(407,278), wok🍳 ~(516,285), griddle🥞 ~(617,280), stew🍲 ~(715,278). Dish-emoji sign sprites float ~y=230 above each.
- Counter customer slots: ~(426,385), (512,385), (600,385); queue extends down-right toward the door ~(735,555).
- Use the `zoom` action on a region to read canvas-drawn order bubbles — DOM has no text for them.

## Catching transient popups
- Popups/toasts ("+N원", "다른 메뉴예요!", "이미 음식을 들고 있어요", "💢 나갔어요") are `.overlay > .popup` divs that live only ~1.1s — screenshots usually miss them. Install a MutationObserver once via browser_console:
  `window.__toasts=[]; new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.className&&String(n.className).includes('popup'))window.__toasts.push(n.textContent)}))).observe(document.querySelector('.overlay'),{childList:true})`
  then read `window.__toasts` after each click.

## Expected strings
- Start: "🍳 주문 폭주 식당", button "점심 러시 시작 (90초)", credits "3D 모델: kArchive · 출처: 쓰레드 dogfooter". Howto has a 5th line: "✌️ ×2 표시 손님은 메뉴 두 개를 주문해요 — 순서대로 두 번 서빙!".
- HUD chips: "💰 N원", "⏱ N초", "😠 N", "들고 있음 <emoji> <name>", "🔥 콤보 ×N" (combo>1).
- ×2 customers: bubble shows two emoji + purple "×2"; first serve must be orders[0] (left emoji); toast "한 개 더 주문했어요!"; patience refills +40% of max.
- Game over: "🧾 오늘의 장사 마감", grade letter S(≥150k gold)/A(≥100k green)/B(≥60k blue)/C(purple), "🏆 최고기록 N원", "🎉 신기록!" when beaten, "🍽 서빙 N개", "😠 놓친 손님 N명", restart button is **"다시 영업하기"** (not "다시하기").
- Score formula: price + round(price*0.5*patienceFrac) + combo*500.

## Multiple Chrome windows hazard
- More than one Chrome window may exist (different --user-data-dir). `wmctrl -l` lists them; the one on screen may not be the one CDP inspects. If DOM state contradicts the screenshot, close the stray (`wmctrl -i -c <id>`) and keep one window maximized.

## Zombie listeners after HMR — IMPORTANT
- `Game.dispose()` removes only the window resize listener — canvas pointerdown/pointermove survive. After Vite HMR remounts, every stale Game keeps handling clicks (saw quadruple "+N원" popups). **Do a full page reload after any code edit before trusting click behavior.**

## Inspecting game state (temp hooks)
- Adding `(window as any).__game = this;` in `init()` and inside `start()` lets you read `__game.customers` (`orders[]`, `patience`, `group.position`, `rotation.y`), `__game.stations` (`state`/`timer`), `__game.score`, `__game.timeLeft`. Useful: set `timeLeft=0.4` to end a round instantly; set `score` to check grade thresholds; set `c.patience` to force face moods; set `c.group.rotation.y=0` to reveal the face sprite (spawn rotation π = faces away from camera — verify whether that's still the case; if so faces are invisible in normal play). Always revert hooks before finishing.
- `browser_console` multi-statement scripts return "undefined" but still execute — read results back with a single-expression call.

## Flyer capture trick
- The serve flyer (`{sprite,t,from,to}`, `t += dt/0.45`) is too fast to screenshot (~1s real). Pin it mid-arc via console before serving:
  `var g=__game,orig=g.updateFlyers.bind(g);g.updateFlyers=function(dt){orig(dt);for(const f of this.flyers){if(f.t>0.5)f.t=0.5}}`
  then `delete g.updateFlyers` to release.

## Serve pitch / combo verification
- Patch `OscillatorNode.prototype.detune` getter (or wrap `sfx.serve`) to log cents: serve tones run `min(combo,10)*100` cents (combo1=100, combo2=200) plus a 4th tone at 1568Hz when combo≥2. Combo window is 6 game-sec ≈ ~15-24 real-s under swiftshader — to trigger ×2 combo, stage TWO done stations then pickup+serve, pickup+serve back-to-back. Customer slides between counter slots when a slot frees — re-check positions right before clicking.
- Narrow-window check: `wmctrl -i -r <win> -b remove,maximized_vert,maximized_horz` then `-e 0,x,y,400,740` (VM min-width lands ~532×740); scene should letterbox, not crop. Restore with `-b add,maximized_vert,maximized_horz`.
- Record/record persists in React state per page load (`useState(()=>localStorage...)`); injected localStorage values are only read at mount — set them then hard-reload to test record paths.

## Meta-loop (Day/shop/fever/VIP) verification
- Shop appears ONLY on the game-over screen ("🛒 업그레이드 상점" toggle). To reach it fast: `__game.timeLeft = 0.5` ends the round in ~1s. "▶️ Day N+1 영업 시작" calls `start()` which increments `day`.
- Verifiable fields: `__game.money` (잔고, persists across days), `__game.day`, `__game.upgrades`, `__game.comboT` (combo window countdown — base 6, +1.5/Lv combo upgrade), `__game.stations[i].cookMul` (0.85^speedLv), customer `maxPatience` (= base × 0.94^(day-1) × 1.15^interiorLv ×1.5 if ×2-order ×0.6 if VIP).
- Fever seeding trick (lead-sanctioned console cheat): `__game.combo = 3` then do ONE real serve → combo hits 4 → real fever path fires: "🔥 피버 타임!" popup, "🔥 피버 타임 ×2" chip, `.app.fever` edge glow, gains ×2 for ~8 game-sec (feverT counts down independently of combo — combo chip can vanish while fever continues).
- VIP: `c.vip` flag + golden capsule 0xf6c945 metalness 0.4. There is NO 👑 in the bubble — VIP is body-color only (verify visually vs 0xffd166 palette yellow which looks similar — the flag is the ground truth). Tip×3: gain = price + round(price*0.5*frac*3) + combo*500 — a frac≈1 VIP serve pays ~3× a normal one's tip portion.
- OS mouse clicks right after a page reload can miss DOM buttons (observed 3× on start button); `document.querySelector('.screen .btn').click()` works as fallback — canvas clicks for stations/customers were unaffected.
