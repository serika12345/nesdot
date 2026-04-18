# CSP `style-src` Hardening Notes（2026-04 時点）

## 現在の到達点

- [../src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json) の `app.security.csp` は `style-src 'self'` のみ。`style-src-elem` は未定義（`style-src` にフォールバック）
- Tauri の `__TAURI_STYLE_NONCE__` トークンを使い、プロダクションビルドでは CSP nonce 方式で Emotion runtime `<style>` を許可
- [../src/index.html](../src/index.html) に `<meta name="csp-nonce" content="__TAURI_STYLE_NONCE__">` を配置。Tauri がページロード時にランダム nonce に置換し、CSP `style-src` に `'nonce-xxx'` を追加する
- [../src/infrastructure/browser/getCspNonce.ts](../src/infrastructure/browser/getCspNonce.ts) が meta タグから nonce を読み取り、Emotion `createCache({ nonce })` に渡す
- [../src/main.tsx](../src/main.tsx) で `@emotion/cache` の `CacheProvider` を使い、全ての Emotion runtime `<style>` タグに nonce 属性を付与
- `style-src-attr` は `['none']` を維持し、style attribute 文字列の注入を禁止
- `devCsp` のみ `style-src-elem: ['self', 'unsafe-inline']` を維持（Tauri dev mode は nonce 置換を行わないため）
- [../src/assets/global.css](../src/assets/global.css) に CssBaseline の global styles を static CSS として抽出し、runtime 依存を削減

## 何が変わったか

Pigment CSS v0.0.30 の `styles.css` はプレースホルダーであり、MUI コンポーネントの基本スタイル（Stack の `display: flex` 等）は全て Emotion runtime で `<style>` タグに注入される。

当初は `style-src-elem` に `'unsafe-inline'` を追加して対応していたが、Tauri の `__TAURI_STYLE_NONCE__` メカニズムを活用して根本解決した：

1. `index.html` の `<meta>` タグに nonce トークンを配置
2. Tauri がビルド時に `<style>` タグへ nonce 属性を追加、実行時にランダム値に置換
3. Emotion `createCache({ nonce })` で動的 `<style>` にも同一 nonce を付与
4. CSP `style-src` に nonce が自動追加され、`'unsafe-inline'` が不要に

## 現在のガードレール

- [../scripts/verify-security.mjs](../scripts/verify-security.mjs) が `style-src` / `style-src-attr` の期待値を検査する
- 同 verifier が `style-src` と `style-src-elem` の両方で `'unsafe-inline'` を禁止する
- 同 verifier が `setAttribute("style", ...)` と `cssText` の使用を拒否する
- [../tests/repo/securityWorkflow.test.ts](../tests/repo/securityWorkflow.test.ts) が production CSP に `style-src-elem` が存在しないことを検証する

## 残る注意点

- Playwright の web preview では Tauri の CSP 自体は実行されないため、最終的な実ランタイム確認は Tauri WebView で別途見る価値がある
- `style-src-attr` / `style-src-elem` は CSP Level 3 依存なので、古い WebView サポート方針を広げる場合は互換性を再確認する
- 将来ライブラリ追加で inline `<style>` を生成する実装が入ると、`CacheProvider` 外の `<style>` は nonce を持たず CSP violation になる。新規ライブラリ導入時は nonce 対応を確認すること

## 次に見るなら

- Pigment CSS が MUI コンポーネントの static CSS extraction を完全サポートした段階で、Emotion runtime の `<style>` 注入自体がなくなり、nonce メカニズムも不要になる
- `devCsp` の `style-src-elem: ['self', 'unsafe-inline']` も、Tauri dev mode が nonce 置換をサポートすれば除去可能
