# Test Plan — 주문 폭주 식당 (Order Rush Diner) E2E

Env: Vite dev server on http://localhost:5173, Chrome for Testing w/ WebGL (swiftshader), 1024×768 screenshot space. One continuous recording of a full 90s round + restart.

## T1 — Start screen
- Reload page; after load, screenshot.
- PASS if: title "🍳 주문 폭주 식당", howto box (4 lines), orange button "점심 러시 시작 (90초)", credits "3D 모델: kArchive · 출처: 쓰레드 dogfooter", and 3D kitchen scene (checker floor, walls, tables) visible behind dimmed overlay. Emoji rendered (not tofu boxes).

## T2 — Start game → HUD + customers
- Click "점심 러시 시작 (90초)" (~center of screen).
- PASS if: overlay clears, HUD chips appear top-center: "💰 0원", "⏱ ~90초", "😠 0". Within ~10s customers walk in from door (bottom-right) to counter slots mid-screen, each with a white bubble showing a dish emoji + green patience bar.

## T3 — Cook a dish
- Read a waiting customer's bubble emoji (zoom screenshot if needed); click the station whose floating emoji sign matches that dish (noodle🍜 leftmost … stew🍲 rightmost, top row).
- PASS if: station model visibly swaps to cooking state; a circular progress ring appears on the station overlay (yellow conic fill). While cooking, click the same station again → PASS if no state change (still cooking, ring keeps filling; no pickup). After cookTime (4–6s) PASS if: model swaps to done state and ring shows "✓" on green.

## T4 — Pick up dish
- Click the done station.
- PASS if: model returns to idle, ring disappears, HUD shows chip "들고 있음 <emoji> <name>".

## T5 — Serve matching customer
- Click the customer whose bubble dish == held dish.
- PASS if: "+N원" popup floats up at the customer, 💰 score increases by that amount, customer bubble flashes ❤️ (green border) and walks out toward door, "들고 있음" chip disappears.

## T6 — Negative: wrong dish
- Hold a dish; click a customer whose bubble shows a DIFFERENT dish.
- PASS if: red toast "다른 메뉴예요!" appears at the customer; no score change; still holding.
- If no differently-ordered customer exists, wait for new arrivals until one appears.

## T7 — Negative: patience runs out
- Leave at least one counter customer unserved for ~26s.
- PASS if: HUD 😠 count increments by 1, "💢 나갔어요" popup shows, customer bubble turns red/💢 and walks out.

## T8 — Game over + restart
- At t=90s (⏱ reaches 0).
- PASS if: screen "🧾 오늘의 장사 마감" with rows "💰 <score>원", "🍽 서빙 N개", "😠 놓친 손님 N명" matching HUD values, button "다시 영업하기", credits line. Click button → PASS if HUD resets (💰 0원, ⏱ 90초, 😠 0) and new round runs.

Click coordinates determined live from screenshots (station emoji signs + customer bubbles). Retry a click once if it doesn't register.
