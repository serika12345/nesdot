# CSP `style-src` Hardening Notes（2026-04 時点）

## 現在の到達点

- [../src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json) の `app.security.csp` / `devCsp` は `default-src` / `script-src` / `style-src` / `style-src-attr` などの strict directive を揃え、差分は dev server 用の `connect-src` に限定している
- `style-src-elem` は両方の CSP から定義を外し、style element の判定は `style-src 'self'` に一本化している
- [../src/main.tsx](../src/main.tsx) は static stylesheet import と Radix Themes root provider のみで起動し、legacy runtime style bootstrap を持たない
- [../src/index.html](../src/index.html) には `csp-nonce` placeholder を置かず、nonce に依存しない
- [../package.json](../package.json) から direct runtime-style package 依存を外している
- [../src/assets/global.css](../src/assets/global.css) に global CSS を置き、component-owned styling は CSS Modules へ寄せている
- `style-src-attr` は `['none']` を維持し、style attribute 文字列の注入を禁止
- `devCsp` も `default-src` / `script-src` / `style-src` / `style-src-attr` などの strict directive は production `csp` と一致させ、差分は dev server 用の `connect-src` のみに限定する

## 何が変わったか

以前は debug / release で別の CSP 経路を通しており、runtime style injector と startup `zod` import を見落としやすかった。

現在は release build と同じ `frontendDist` / production CSP を使う debug binary を起動して `pnpm verify:tauri:csp` を回しつつ、legacy runtime style bootstrap を持たない entrypoint と static CSS 配信を前提にし、JSON import の `zod` は interaction 時の dynamic import に分離している。

## 現在のガードレール

- [../scripts/verify-security.mjs](../scripts/verify-security.mjs) が production `csp` の期待値を検査し、`devCsp` にも `connect-src` 以外は同じ directive set を要求する
- 同 verifier が `style-src` で `'unsafe-inline'` を禁止し、`style-src-elem` の明示定義自体も拒否する
- 同 verifier が `setAttribute("style", ...)` と `cssText` の使用を拒否する
- 同 verifier が legacy runtime style bootstrap の不在と、`useImportImage` の dynamic import 境界を確認する
- [../scripts/verify-tauri-csp.mjs](../scripts/verify-tauri-csp.mjs) が `tauri build --debug --no-bundle` で生成した debug binary を起動し、release build と同じ `frontendDist` / production CSP 経路で runtime diagnostics file と macOS unified log を検査する

## 残る注意点

- Playwright の web preview では Tauri の CSP 自体は実行されないため、最終確認は `pnpm verify:tauri:csp` を使う
- `style-src-attr` / `style-src-elem` は CSP Level 3 依存なので、古い WebView サポート方針を広げる場合は互換性を再確認する
- 将来追加するライブラリが runtime `<style>` を挿入する場合、production CSP と衝突する。導入時は `pnpm verify:tauri:csp` を必ず通す
- static CSS 前提を崩す runtime style engine を将来導入する場合は、この文書と verifier を更新したうえで CSP 方針を再評価する
