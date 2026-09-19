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
- Start: "🍳 주문 폭주 식당", button "점심 러시 시작 (90초)", credits "3D 모델: kArchive · 출처: 쓰레드 dogfooter".
- HUD chips: "💰 N원", "⏱ N초", "😠 N", "들고 있음 <emoji> <name>", "🔥 콤보 ×N" (combo>1).
- Game over: "🧾 오늘의 장사 마감", "🍽 서빙 N개", "😠 놓친 손님 N명", restart button is **"다시 영업하기"** (not "다시하기").
- Score formula: price + round(price*0.5*patienceFrac) + combo*500.
