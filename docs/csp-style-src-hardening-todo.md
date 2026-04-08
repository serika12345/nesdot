# CSP style-src Hardening TODO

目的:

- `src-tauri/tauri.conf.json` の `app.security.csp.style-src` と `app.security.devCsp.style-src` から `'unsafe-inline'` を外せる状態にする。
- UI の見た目と操作を維持したまま、inline style 依存と runtime style injection の扱いを整理する。

現状の主なブロッカー:

- `src/presentation/**` に React の `style={...}` がまだ残っている。
- `src/presentation/components/characterMode/hooks/useCharacterModeState.ts` などに DOM の `.style.setProperty(...)` が残っている。
- MUI / Emotion が runtime に `<style>` タグを挿入するため、`'unsafe-inline'` を消すには nonce 対応の方針決定が必要。

TODO 1. Presentation 層の `style={...}` を削減する

- Chevron 回転用の `style` を `styled(...)` か state prop を受ける専用コンポーネントへ寄せる。
- 対象候補:
  - `src/presentation/components/common/actions/ProjectActions.tsx`
  - `src/presentation/components/characterMode/decomposition/CharacterModeDecompositionToolOverlay.tsx`
  - `src/presentation/components/characterMode/sidebar/CharacterModeSidebarLibrary.tsx`
  - `src/presentation/components/screenMode/panels/ScreenModeSpritePlacementPanel.tsx`
  - `src/presentation/components/screenMode/panels/ScreenModeSelectedSpritePanel.tsx`
  - `src/presentation/components/screenMode/panels/ScreenModeGroupMovePanel.tsx`
  - `src/presentation/components/screenMode/panels/ScreenModeGestureWorkspace.tsx`
  - `src/presentation/components/bgMode/panels/BgModeWorkspacePanel.tsx`

- レイアウトや swatch 用の `style` を shared primitive / `styled(...)` へ寄せる。
- 対象候補:
  - `src/presentation/components/common/pickers/PalettePicker.tsx`
  - `src/presentation/components/spriteMode/overlay/SpriteModeToolOverlay.tsx`
  - `src/presentation/components/spriteMode/menu/SpriteModeToolMenu.tsx`
  - `src/presentation/components/spriteMode/forms/SpriteModePaletteSlots.tsx`
  - `src/presentation/components/characterMode/preview/CharacterModeTilePreview.tsx`

TODO 2. DOM 直接 style 操作を class / render 条件ベースへ寄せる

- `src/presentation/components/characterMode/hooks/useCharacterModeState.ts`
  - `image-rendering` の直接設定を canvas mount 側の styled 定義へ移す。
  - `display` / `pointer-events` の切り替えは wrapper style mutation ではなく conditional render か state prop へ移す。

- `src/infrastructure/browser/canvas/useGhost.ts`
  - `img.style.*` によるドラッグゴースト描画を見直す。
  - 候補は className + CSS 変数、または React / portal 側での preview 表示への移行。

- `src/infrastructure/browser/useImportImage.ts`
  - `input.setAttribute("style", "display:none")` を `hidden` か class ベースへ変更する。

TODO 3. Emotion / MUI の CSP nonce 方針を決める

- `src/main.tsx` に Emotion `CacheProvider` + `createCache({ key, nonce, prepend: true })` を導入できるか検証する。
- `GlobalStyles` と `styled(...)` が生成する runtime style tag に nonce を付与する。
- Tauri v2 側で使う nonce の受け渡し方法を確定する。
  - Tauri が付与する nonce を frontend から参照できるか確認する。
  - 参照できない場合は、Tauri 設定と矛盾しない nonce 受け渡し方法を別途設計する。

TODO 4. CSP を締める

- `src-tauri/tauri.conf.json` から `style-src` の `'unsafe-inline'` を削除する。
- `scripts/verify-security.mjs` で `style-src` に `'unsafe-inline'` が残っていたら失敗させる。
- `src/shared/securityWorkflow.test.ts` も同じ前提に更新する。

TODO 5. 回帰確認を追加する

- dev / build の両方で CSP violation が出ないことを確認する。
- 必要なら console E2E に CSP violation 非発生の観点を追加する。

実装の切り分け案:

1. Presentation 層の `style={...}` を減らす PR
2. DOM 直接 style 操作を減らす PR
3. Emotion nonce 導入と `style-src` tightening を行う PR

未解決メモ:

- `MUI + Emotion + Tauri v2` で nonce をどう安定供給するかは実装前に再確認が必要。
- `style-src 'unsafe-inline'` を外すための本丸は Emotion の runtime style tag 対応で、`style={...}` 削減だけでは完了しない。
