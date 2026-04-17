# CSP `style-src` Hardening Notes（2026-04 時点）

## 現在の到達点

- [../src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json) の `app.security.csp` / `app.security.devCsp` は `style-src 'self'` に tightened 済み
- `style-src-elem` は `['self']` に分離し、runtime の inline `<style>` 注入を許可しない
- `style-src-attr` は `['none']` に設定し、style attribute 文字列の注入を禁止している
- [../scripts/verify-security.mjs](../scripts/verify-security.mjs) は `unsafe-inline` の再流入を検知し、`setAttribute("style", ...)` と `cssText` も禁止している
- [../src/infrastructure/browser/useImportImage.ts](../src/infrastructure/browser/useImportImage.ts) の fallback input は `hidden` に置き換え済み

## 何が変わったか

zero-runtime CSS 移行後は、Emotion nonce 経路を整備しなくても `style-src-elem` を先に締められる状態になっていた。

加えて、`style-src-attr` は `style` attribute 文字列を対象にする一方、現在のブラウザ実装では `element.style.*` / `style.setProperty(...)` のような `CSSStyleDeclaration` 経由の更新は別扱いで動作する。このため、既存の React `style={...}` や一部の DOM style 操作を直ちに全廃しなくても `style-src-attr 'none'` まで進められる。

## 現在のガードレール

- [../scripts/verify-security.mjs](../scripts/verify-security.mjs) が `style-src` / `style-src-elem` / `style-src-attr` の期待値を検査する
- 同 verifier が `setAttribute("style", ...)` と `cssText` の使用を拒否する
- [../tests/repo/securityWorkflow.test.ts](../tests/repo/securityWorkflow.test.ts) が repo レベルで前提文字列を固定する

## 残る注意点

- Playwright の web preview では Tauri の CSP 自体は実行されないため、最終的な実ランタイム確認は Tauri WebView で別途見る価値がある
- `style-src-attr` / `style-src-elem` は CSP Level 3 依存なので、古い WebView サポート方針を広げる場合は互換性を再確認する
- 将来ライブラリ追加で inline `<style>` を生成する実装が入ると、Tauri 実行時に CSP violation になる可能性がある

## 次に見るなら

- 主要画面を Tauri 実行で一巡して CSP violation が出ないことを確認する
- 余裕があれば `style={...}` のうち固定値中心のものから Pigment CSS 側へ寄せて、将来の CSP 変更余地をさらに増やす
