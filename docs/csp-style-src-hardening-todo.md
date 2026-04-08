# CSP `style-src` Hardening TODO（2026-04 時点）

## 目的

- [../src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json) の `app.security.csp.style-src` と `app.security.devCsp.style-src` から `'unsafe-inline'` を外せる状態にする
- UI の見た目と操作を維持したまま、inline style 依存と runtime style injection の境界を整理する

## 現在の状態

- `'unsafe-inline'` はまだ [../src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json) の `csp` / `devCsp` 両方で必須になっています
- [../scripts/verify-security.mjs](../scripts/verify-security.mjs) は現時点で `style-src` に `'unsafe-inline'` が含まれることを検査しており、[../src/shared/securityWorkflow.test.ts](../src/shared/securityWorkflow.test.ts) も同じ前提です
- [../src/main.tsx](../src/main.tsx) には Emotion nonce を付ける `CacheProvider` / `createCache` が未導入です
- Presentation 層とインフラ層に `style={...}` と DOM 直接 style 操作が残っています

この TODO は「CSP をすぐ締める」ためのものではなく、「締めても壊れない状態に順番に寄せる」ための作業メモです。

## ブロッカー 1. Emotion / MUI の nonce 経路が未整備

現状の root render は [../src/main.tsx](../src/main.tsx) の `ThemeProvider` + `CssBaseline` + `App` だけです。

- `CacheProvider` は未導入
- `createCache({ nonce, ... })` も未導入
- Tauri 側 nonce を frontend へどう渡すかも未決定

`'unsafe-inline'` を外す本丸はここです。`style={...}` を減らすだけでは完了しません。

## ブロッカー 2. `style={...}` がまだ残っている

### 回転 chevron / 開閉 UI 系

- [../src/presentation/components/common/actions/ProjectActions.tsx](../src/presentation/components/common/actions/ProjectActions.tsx)
- [../src/presentation/components/characterMode/decomposition/CharacterModeDecompositionToolOverlay.tsx](../src/presentation/components/characterMode/decomposition/CharacterModeDecompositionToolOverlay.tsx)
- [../src/presentation/components/characterMode/sidebar/CharacterModeSidebarLibrary.tsx](../src/presentation/components/characterMode/sidebar/CharacterModeSidebarLibrary.tsx)
- [../src/presentation/components/screenMode/panels/ScreenModeSpritePlacementPanel.tsx](../src/presentation/components/screenMode/panels/ScreenModeSpritePlacementPanel.tsx)
- [../src/presentation/components/screenMode/panels/ScreenModeSelectedSpritePanel.tsx](../src/presentation/components/screenMode/panels/ScreenModeSelectedSpritePanel.tsx)
- [../src/presentation/components/screenMode/panels/ScreenModeGroupMovePanel.tsx](../src/presentation/components/screenMode/panels/ScreenModeGroupMovePanel.tsx)
- [../src/presentation/components/screenMode/panels/ScreenModeGestureWorkspace.tsx](../src/presentation/components/screenMode/panels/ScreenModeGestureWorkspace.tsx)
- [../src/presentation/components/bgMode/panels/BgModeWorkspacePanel.tsx](../src/presentation/components/bgMode/panels/BgModeWorkspacePanel.tsx)

### レイアウト / swatch / canvas style 系

- [../src/presentation/components/common/pickers/PalettePicker.tsx](../src/presentation/components/common/pickers/PalettePicker.tsx)
- [../src/presentation/components/spriteMode/overlay/SpriteModeToolOverlay.tsx](../src/presentation/components/spriteMode/overlay/SpriteModeToolOverlay.tsx)
- [../src/presentation/components/spriteMode/menu/SpriteModeToolMenu.tsx](../src/presentation/components/spriteMode/menu/SpriteModeToolMenu.tsx)
- [../src/presentation/components/spriteMode/forms/SpriteModePaletteSlots.tsx](../src/presentation/components/spriteMode/forms/SpriteModePaletteSlots.tsx)
- [../src/presentation/components/characterMode/preview/CharacterModeTilePreview.tsx](../src/presentation/components/characterMode/preview/CharacterModeTilePreview.tsx)

まずはこの層を減らして、nonce 対応前に片付けられるものを片付けるのが安全です。

## ブロッカー 3. DOM 直接 style 操作が残っている

### ドラッグゴースト

[../src/infrastructure/browser/canvas/useGhost.ts](../src/infrastructure/browser/canvas/useGhost.ts) が `img.style.*` で次を直接変更しています。

- `position`
- `pointerEvents`
- `opacity`
- `transform`
- `zIndex`
- `left`
- `top`

### character compose canvas

[../src/presentation/components/characterMode/hooks/useCharacterModeState.ts](../src/presentation/components/characterMode/hooks/useCharacterModeState.ts) が `composeCanvas.lowerCanvasEl` / `upperCanvasEl` / `wrapperEl` に対して `style.setProperty(...)` を使っています。

- `image-rendering`
- `display`
- `pointer-events`

### import fallback input

[../src/infrastructure/browser/useImportImage.ts](../src/infrastructure/browser/useImportImage.ts) が `input.setAttribute("style", "display:none")` を使っています。

ここは `hidden` や class ベースに寄せやすいので、比較的先に片付けられます。

## ブロッカー 4. 検証コードの前提がまだ逆向き

`'unsafe-inline'` を外す作業では、設定ファイルだけでなく検証コードも同じ PR で更新する必要があります。

- [../src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json): `style-src` の tightening
- [../scripts/verify-security.mjs](../scripts/verify-security.mjs): 現状は `'unsafe-inline'` の存在を要求しているため、条件を反転する必要がある
- [../src/shared/securityWorkflow.test.ts](../src/shared/securityWorkflow.test.ts): 期待値の更新が必要
- console E2E: dev / build の両方で CSP violation が出ないことを確認したい

## 推奨する作業順

### 1. 先に片付けやすい inline style を減らす

- chevron 回転や小さな `style={...}` を `styled(...)` や state prop に寄せる
- `useImportImage.ts` の hidden input を `hidden` / class 化する

### 2. DOM 直接 style 操作を class / render 条件へ寄せる

- `useGhost.ts`
- `useCharacterModeState.ts`

### 3. Emotion nonce を導入する

- `CacheProvider`
- `createCache({ nonce, prepend: true })`
- Tauri から nonce を受け取る経路

### 4. その後に CSP と検証コードを締める

- `tauri.conf.json`
- `verify-security.mjs`
- `securityWorkflow.test.ts`
- CSP violation の回帰確認

## 未解決メモ

- `MUI + Emotion + Tauri v2` の nonce 供給方法は、実装前に再確認が必要
- `style-src 'unsafe-inline'` を外すための本丸は Emotion の runtime style tag 対応で、`style={...}` 削減だけでは完了しない
