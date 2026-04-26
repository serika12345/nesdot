# 開発マニュアル

この文書は、NESDOT の開発を人間が継続しやすくするための実務向けマニュアルです。`README.md` の概要説明、`AGENTS.md` の機械的ルール、`package.json` / `flake.nix` / `src-tauri/tauri.conf.json` の実装事実を、人間が追いやすい形にまとめています。

機械的な最終ルールは引き続き [`AGENTS.md`](../AGENTS.md) が優先です。この文書は、その内容を人間向けの導線として整理したものと考えてください。

## 1. このリポジトリが何を作っているか

NESDOT は、NES / ファミコンの画面制約を意識しながらドット絵を編集するためのアプリです。

- フロントエンドは `React + TypeScript + Vite`
- UI は `Radix Themes + CSS Modules + static global CSS`
- 状態管理は `Zustand`
- 関数型ユーティリティとして `fp-ts`
- 外部データ境界の検証に `zod`
- デスクトップアプリ殻に `Tauri`
- 環境固定とビルド補助に `Nix flake`

アプリは大きく 4 つの作業モードを持ちます。

- `sprite`: スプライト編集
- `character`: キャラクター編集
- `bg`: 背景タイル編集
- `screen`: 画面配置

このモード切替は [`src/application/state/workbenchStore.ts`](../src/application/state/workbenchStore.ts) の `WorkMode` と、[`src/presentation/App.tsx`](../src/presentation/App.tsx) の画面オーケストレーションが中核です。

## 2. 最初に読むべきファイル

初めて触る人は、次の順で読むと全体像をつかみやすいです。

1. [`README.md`](../README.md)
   プロダクト概要、主要モード、開発者向け文書への入口があります。
2. [`AGENTS.md`](../AGENTS.md)
   開発ルールの機械的な source of truth です。
3. [`package.json`](../package.json)
   日常で使う script はここが正本です。
4. [`flake.nix`](../flake.nix)
   dev shell と Nix build の前提を定義しています。
5. [`src/main.tsx`](../src/main.tsx)
   アプリ起動時の provider 構成と static CSS 前提の entrypoint が分かります。
6. [`src/presentation/App.tsx`](../src/presentation/App.tsx)
   モード切替、更新ダイアログ、ネイティブメニュー連携、undo/redo の全体制御があります。
7. [`src/application/state/projectStore.ts`](../src/application/state/projectStore.ts)
   プロジェクト全体状態の入り口です。
8. [`src-tauri/src/lib.rs`](../src-tauri/src/lib.rs)
   Tauri 側のメニュー、診断、更新関連の実装があります。

## 3. 開発環境の前提

### 3.1 絶対ルール

このリポジトリの開発コマンドはすべて Nix dev shell 内で実行します。

- 対話シェルに入る: `nix develop`
- 単発実行: `nix develop -c zsh -lc '<command>'`

やってはいけないこと:

- ホスト shell から直接 `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, `tsc` を叩く
- shell 外で失敗したコマンドを、そのまま環境差分つきで再解釈してごまかす

何かが見つからない、バージョンが違う、ネイティブ依存が足りない、という類のエラーは、まず「dev shell の外で実行していないか」を疑ってください。

### 3.2 必要なもの

- Nix
- Git

あると便利なもの:

- `direnv` + `nix-direnv`
- VS Code
- WSL 利用時は `Remote - WSL`

### 3.3 初回セットアップ

```sh
nix develop -c zsh -lc 'pnpm install'
```

`direnv` を使う場合:

```sh
direnv allow
```

### 3.4 WSL 利用時の注意

WSL を使う場合は、Windows 側ではなく WSL 側のファイルシステムで作業してください。

- clone 先は `/mnt/c/...` ではなく `~/src/...` など
- GUI を使うなら `WSLg` を有効にする
- 状態確認は `nix develop -c zsh -lc 'pnpm doctor:wsl'`

WSL まわりの詳細はこの節と、必要に応じて `pnpm doctor:wsl` の出力で確認してください。

## 4. 日常開発の始め方

### 4.1 フロントエンドだけ動かす

```sh
nix develop -c zsh -lc 'pnpm dev'
```

- Vite の開発サーバーを起動します
- VS Code の `Launch Frontend (Chrome, 1420)` もこの前提です

### 4.2 Tauri デスクトップとして動かす

```sh
nix develop -c zsh -lc 'pnpm start'
```

- `tauri dev` を通じてデスクトップアプリを起動します
- `src-tauri/tauri.conf.json` の `beforeDevCommand` でフロントエンド開発サーバーも連動します

### 4.3 ビルド確認

```sh
nix develop -c zsh -lc 'pnpm build'
```

Web 配布物だけでなく、Tauri build 前提のフロントエンドビルド確認にも使います。

### 4.4 Nix パッケージとして確認

```sh
nix build
```

- デスクトップ向け: `./result/bin/nesdot`
- Web 向けのみ: `nix build .#web`

`pnpm-lock.yaml` を更新したら、`flake.nix` の `fetchPnpmDeps` hash も確認してください。

```sh
nix develop -c zsh -lc 'pnpm nix:check-pnpm-deps-hash'
nix develop -c zsh -lc 'pnpm nix:sync-pnpm-deps-hash'
```

### 4.5 README スクリーンショット更新

README に貼っている製品スクリーンショットは Playwright で再生成できます。

```sh
nix develop -c zsh -lc 'pnpm e2e:install'
nix develop -c zsh -lc 'pnpm docs:readme:screenshots'
```

生成先:

- `docs/assets/readme/sprite-mode.png`
- `docs/assets/readme/character-mode.png`
- `docs/assets/readme/screen-mode.png`

この script は一時ディレクトリに静的 preview を build し、内蔵 HTTP server で配信してから README 用の 3 画面を撮影します。

## 5. VS Code での推奨運用

### 5.1 推奨拡張

[`.vscode/extensions.json`](../.vscode/extensions.json) では次を推奨しています。

- ESLint
- Prettier
- EditorConfig
- Nix IDE
- direnv
- Playwright
- rust-analyzer
- CodeLLDB
- Vitest Explorer
- Remote - WSL

### 5.2 Run Task

[`.vscode/tasks.json`](../.vscode/tasks.json) には、普段使うコマンドが Nix dev shell 前提で登録されています。

代表的なもの:

- `Run Frontend Dev Server`
- `Run Tauri Dev`
- `Format Check`
- `Verify`
- `Verify UI`
- `Verify Full`
- `Verify Rust`
- `Verify CI`
- `Run Unit Tests`
- `Run Console E2E`
- `Run Full E2E`
- `Release Desktop Dry Run`
- `Deploy Desktop Release`
- `Run WSL Doctor`

迷ったら、まず VS Code task を使うのが安全です。task 側で Nix dev shell 呼び出しが固定されているため、手元環境差分を踏みにくくなります。

### 5.3 Run and Debug

[`.vscode/launch.json`](../.vscode/launch.json) には 3 種類の導線があります。

- `Launch Frontend (Chrome, 1420)`
- `Launch Tauri Desktop`
- `Launch Tauri Desktop + Attach Frontend`

Rust にブレークポイントを張る場合は `Launch Tauri Desktop` を使ってください。これは task `Prepare Tauri Rust Debug` を前提に、`src-tauri/target/debug/nesdot` を LLDB で起動します。

## 6. ディレクトリ構成と責務

### 6.1 上位ディレクトリ

- [`src/domain`](../src/domain)
  純粋なドメインロジック。NES 制約、投影、CHR 変換、背景パレット、画面制約など。
- [`src/application/state`](../src/application/state)
  グローバル状態。Zustand ストアと undo 履歴。
- [`src/infrastructure/browser`](../src/infrastructure/browser)
  ブラウザ / Tauri API 境界。import/export、更新確認、canvas、PWA 周辺。
- [`src/presentation`](../src/presentation)
  React UI。モード別の画面、共通 UI、テーマ。
- [`src-tauri`](../src-tauri)
  Tauri 側のネイティブ実装。ウィンドウ、メニュー、updater、CSP 関連診断。
- [`e2e`](../e2e)
  Playwright による E2E。
- [`tests/repo`](../tests/repo)
  リポジトリ方針・workflow・設定・文書整合性のテスト。
- [`scripts`](../scripts)
  security / license / CVE / CSP / release まわりの検証スクリプト。
- [`docs`](.)
  設計メモ、移行計画、運用文書。

### 6.2 モード別 UI の置き場所

- スプライト編集: [`src/presentation/components/spriteMode`](../src/presentation/components/spriteMode)
- キャラクター編集: [`src/presentation/components/characterMode`](../src/presentation/components/characterMode)
- BG 編集: [`src/presentation/components/bgMode`](../src/presentation/components/bgMode)
- 画面配置: [`src/presentation/components/screenMode`](../src/presentation/components/screenMode)
- 共通 UI: [`src/presentation/components/common`](../src/presentation/components/common)

迷ったときの原則:

- NES 仕様や座標変換をいじるなら `domain`
- 状態の持ち方をいじるなら `application/state`
- Tauri や browser API を触るなら `infrastructure`
- 見た目や操作フローをいじるなら `presentation`

## 7. 実行時アーキテクチャ

### 7.1 起動シーケンス

[`src/main.tsx`](../src/main.tsx) では次を行っています。

- static CSS を読み込む
- Radix Themes の root provider を構成する
- `App` を mount

このため、CSP や style 配信まわりを触るときは `main.tsx` と `src-tauri/tauri.conf.json` を対で確認してください。

### 7.2 App の責務

[`src/presentation/App.tsx`](../src/presentation/App.tsx) は単なるルーターではなく、アプリ全体の制御点です。

- 作業モード切替
- グローバル undo / redo
- ネイティブメニューイベントの受け口
- Desktop / PWA 更新通知
- 共通メニューと共通ダイアログの表示

モード追加や、モード共通のショートカット追加はまずここを読みます。

### 7.3 状態の分担

#### `useProjectState`

[`src/application/state/projectStore.ts`](../src/application/state/projectStore.ts)

- スプライト
- 画面
- NES 状態
- 画面プレビュー用の変換補助

を持つ、アプリ中核のストアです。

注意点:

- IndexedDB 永続化の実装は残っています
- ただし現在の store 定義では `persist(...)` が無効化されており、実運用では JSON 保存 / 復元が中心です

#### `useWorkbenchState`

[`src/application/state/workbenchStore.ts`](../src/application/state/workbenchStore.ts)

- 現在の編集モード
- 現在のツール
- 選択中スプライト
- 各モードの UI ローカル状態

を持ちます。永続化対象ではなく、「今どんな操作をしているか」を表す状態です。

#### `useCharacterState`

[`src/application/state/characterStore.ts`](../src/application/state/characterStore.ts)

- キャラクターセット一覧
- 選択中キャラクター
- キャラクター JSON への変換 / 復元

を担当します。画面配置やキャラクター編集の橋渡しをするので、キャラクター機能追加時はこの store もほぼ確実に触ります。

### 7.4 ドメイン層

代表的な責務:

- [`src/domain/nes`](../src/domain/nes)
  NES 制約、レンダリング、パレット、CHR、投影。
- [`src/domain/project`](../src/domain/project)
  プロジェクト型、初期状態、保存フォーマット schema。
- [`src/domain/screen`](../src/domain/screen)
  画面配置、背景パレット、制約、OAM 同期。
- [`src/domain/characters`](../src/domain/characters)
  キャラクターセットと分解ロジック。

UI で無理に座標計算や配列操作を書き始めたら、たいてい責務の置き場所がずれています。まず domain に寄せられないか検討してください。

### 7.5 外部データ境界

このリポジトリでは、外から入るデータは runtime で検証する前提です。

実例:

- [`src/infrastructure/browser/useImportImage.ts`](../src/infrastructure/browser/useImportImage.ts)
  JSON import / 復元境界の `zod` 検証
- [`src/domain/project/projectV2Schema.ts`](../src/domain/project/projectV2Schema.ts)
  新しいプロジェクト表現の schema 契約

フォーマットを触るときの原則:

- `unknown` / 生 JSON のまま core ロジックに入れない
- schema で parse してから state に入れる
- import/export 仕様を変えるなら schema と test を同時に更新する

### 7.6 Tauri 側

[`src-tauri/src/lib.rs`](../src-tauri/src/lib.rs) には、Web 側にはないネイティブ責務があります。

- macOS ネイティブメニューの構築
- メニューイベントを WebView へ emit
- runtime diagnostics の記録
- updater 用設定の呼び出し

ネイティブメニュー項目を追加した場合は、`lib.rs` だけで終わりません。`App.tsx` 側のイベント購読も見直してください。

## 8. 変更するときの基本方針

### 8.1 小さく安全に変える

このリポジトリでは、最小差分が美徳というより、「必要十分な根本修正を最小スコープで入れる」ことが求められます。

- まず既存コードを読む
- 影響範囲を絞る
- 観測可能な挙動なら先に test を足す
- 実装する
- 変更種別に応じた verify を回す

### 8.2 TypeScript / React / UI スタイリングの重要ルール

`AGENTS.md` から、日常的に特に重要なものだけ抜くと次のとおりです。

- `any` を使わない
- `as` を使わない
- non-null assertion (`!`) を使わない
- `let` / `var` を使わず `const`
- 引数や共有状態を mutate しない
- mutating array method を避ける
- truthy / falsy に頼らず明示比較する
- 外部データは `zod` で検証する
- React では view-local でないロジックを component の外へ出す
- `useEffect` を増やす前に、導出・イベントハンドラ・state 再設計で解けないか考える
- UI スタイリングは [`docs/static-css-architecture.md`](./static-css-architecture.md) を基準にし、Radix Themes の semantic props、共有静的コンポーネント、CSS Modules、`src/assets/global.css` を使い分ける
- 新しい `styled(...)` や runtime style injection 前提の見た目実装は追加しない

### 8.3 `tests/repo` の存在を忘れない

このリポジトリは、コードだけでなく workflow や文書の整合性も `tests/repo` で見ています。

つまり次の変更は、見た目以上に広く影響します。

- `README.md`
- `package.json`
- `flake.nix`
- `.vscode/tasks.json`
- release / security / nix 周辺の scripts

「設定だけだから気軽に」という感覚で触ると、policy test に止められます。

## 9. 変更種別ごとの作業ガイド

### 9.1 ドメインロジックを変えるとき

対象:

- NES 制約
- CHR 変換
- パレット処理
- 座標計算
- 背景・画面配置ロジック

見る場所:

- `src/domain/**`
- それを使う `src/application/state/**` または `src/presentation/**/logic/**`

先にやること:

- 該当モジュールの `*.test.ts` を探す
- バグ修正なら再現 test を先に足す

### 9.2 UI を変えるとき

対象:

- レイアウト
- ボタンやフォーム
- 表示状態
- モード遷移
- ユーザー操作

見る場所:

- `src/presentation/components/<mode>/ui/**`
- `src/presentation/components/<mode>/logic/**`
- 必要に応じて `src/assets/global.css`

方針:

- 画面構成は shared component と CSS Modules で表す
- レイアウトや見た目が繰り返されたら shared UI へ抽出する
- ロジックを component 本体に埋め込みすぎない

### 9.3 import / export / 保存形式を変えるとき

対象:

- JSON save / restore
- character JSON
- PNG / SVG / CHR export

見る場所:

- `src/infrastructure/browser/useExportImage.ts`
- `src/infrastructure/browser/useImportImage.ts`
- `src/domain/project/projectV2Schema.ts`
- `src/application/state/characterStore.ts`

注意点:

- 外部データ境界なので `zod` の更新が必要になりやすい
- export だけ変えて import を忘れる、またはその逆をやりがち
- `verify:security` の対象にも関わる

### 9.4 Tauri / Rust を変えるとき

対象:

- ネイティブメニュー
- updater
- CSP 診断
- バンドル設定
- Rust command / emit

見る場所:

- `src-tauri/src/lib.rs`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- 必要に応じて `scripts/verify-tauri-csp*.mjs`

注意点:

- Web 側イベント購読との対応を確認する
- `pnpm verify:rust` を必ず回す
- macOS で CSP や起動経路に影響するなら `pnpm verify:tauri:csp` まで見る

### 9.5 依存・toolchain・Nix を変えるとき

対象:

- `package.json`
- `pnpm-lock.yaml`
- `flake.nix`
- lint / tsconfig / playwright / vite 設定

追加で意識すること:

- `pnpm install` は dev shell 内でのみ実行する
- `pnpm-lock.yaml` 変更時は `pnpm nix:check-pnpm-deps-hash`
- 必要なら `pnpm nix:sync-pnpm-deps-hash`
- 依存の build script を許可するなら `pnpm approve-builds`
- license / CVE / system library 検証の影響が出やすい

## 10. 検証コマンドの考え方

### 10.1 日常の基準

通常の TypeScript コード変更なら、まずこれを基準にします。

```sh
nix develop -c zsh -lc 'pnpm verify'
```

中身:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm verify:security`
- `pnpm test`

### 10.2 変更種別ごとの目安

| 変更種別                          | 最低限の目安                                                             |
| --------------------------------- | ------------------------------------------------------------------------ |
| 通常コード                        | `pnpm verify`                                                            |
| UI 変更                           | `pnpm verify:ui`                                                         |
| UI の表示や操作フロー変更         | `pnpm verify:full`                                                       |
| Rust / Tauri 変更                 | `pnpm verify:rust` に加え、必要なら `pnpm verify` / `pnpm verify:ui`     |
| macOS の Tauri CSP / 起動経路変更 | `pnpm verify:tauri:csp`                                                  |
| 依存更新                          | `pnpm verify:licenses`、`pnpm verify:cve`、必要に応じて `pnpm verify:ci` |
| CI 相当を一括確認                 | `pnpm verify:ci`                                                         |

### 10.3 個別コマンド

```sh
nix develop -c zsh -lc 'pnpm format:check'
nix develop -c zsh -lc 'pnpm lint'
nix develop -c zsh -lc 'pnpm typecheck:safety'
nix develop -c zsh -lc 'pnpm verify:security'
nix develop -c zsh -lc 'pnpm test'
nix develop -c zsh -lc 'pnpm test:e2e:console'
nix develop -c zsh -lc 'pnpm test:e2e'
nix develop -c zsh -lc 'pnpm verify:rust'
nix develop -c zsh -lc 'pnpm verify:licenses'
nix develop -c zsh -lc 'pnpm verify:cve'
```

### 10.4 `verify:security` が見ているもの

`verify:security` は単なる依存監査ではありません。次のような境界を機械的に見ています。

- 依存サプライチェーン設定
- workflow の `--frozen-lockfile`
- Tauri updater 設定
- JSON import / restore 境界

保存形式や updater や CI を触ったのに `verify:security` を省略すると、かなり危険です。

### 10.5 macOS Tauri CSP Runtime Verification

```sh
nix develop -c zsh -lc 'pnpm verify:tauri:csp'
```

この検証は macOS 専用です。`tauri dev` の `devUrl` 経路は使わず、`pnpm tauri build --debug --no-bundle` で生成した `src-tauri/target/debug/nesdot` を実際に起動します。これにより `frontendDist` と production `app.security.csp` は release build と同じ経路になります。

`app.security.devCsp` も `connect-src` 以外の strict directive は production `csp` と一致させ、debug / release 間で script/style 系 CSP がずれないようにしています。起動中はフロントエンドが `console.error` / `window.onerror` / `unhandledrejection` / `securitypolicyviolation` を一時診断ファイルへ記録し、script はその内容に加えて macOS unified log も補助的に確認します。

### 10.6 License Verification

```sh
nix develop -c zsh -lc 'pnpm verify:licenses'
```

この license 検証では、Node / Rust dependency の GPL / LGPL / AGPL 系 license expression と、Linux 向け Tauri system library の reviewed baseline を独立に確認します。`verify:licenses` は `verify:security` に含めず、license 確認だけを分離して回せるようにしています。

### 10.7 System Library Verification

```sh
nix develop -c zsh -lc 'pnpm verify:system-libraries'
```

この system library 確認では、`flake.nix` の `linuxBuildInputs` にある Linux 向け Tauri runtime / build 依存を対象に、lock された `nixpkgs` metadata から license を引いて reviewed baseline と照合します。現在の確認対象には `gtk3`、`libsoup_3`、`webkitgtk_4_1` などが含まれます。

弱い copyleft を含む既知 system library は reviewed として一覧表示し、未審査 package の追加、license metadata の変更、強い copyleft の混入があれば失敗します。

### 10.8 CVE Audit

```sh
nix develop -c zsh -lc 'pnpm verify:cve'
```

この監査では `pnpm audit` と `cargo audit` を実行し、既知 advisory は `scripts/cve-audit-baseline.json` を baseline として管理します。baseline にない新規 advisory が出た場合だけ失敗します。

## 11. テストの読み方

### 11.1 テストの種類

- 近接 unit test
  例: `src/domain/**.test.ts`
- React component / logic test
  例: `src/presentation/**.test.ts(x)`
- E2E
  例: `e2e/*.spec.ts`
- リポジトリポリシーテスト
  例: `tests/repo/*.test.ts`

### 11.2 どれを足すべきか

- 純粋ロジック: まず unit test
- UI の表示分岐: component test
- ユーザー操作や画面遷移: E2E
- 設定や workflow の契約: repo test

### 11.3 E2E の注意

Playwright のブラウザが未導入なら:

```sh
nix develop -c zsh -lc 'pnpm e2e:install'
```

E2E では階層依存セレクタではなく、role / name / label / test id を優先してください。

## 12. トラブルシュート

### 12.1 コマンドが見つからない、バージョンが違う

まず dev shell の外で実行していないか確認してください。

```sh
nix develop -c zsh -lc '<command>'
```

### 12.2 Playwright が失敗する

ブラウザ未導入の可能性があります。

```sh
nix develop -c zsh -lc 'pnpm e2e:install'
```

### 12.3 `nix build` が lockfile hash mismatch で落ちる

```sh
nix develop -c zsh -lc 'pnpm nix:check-pnpm-deps-hash'
nix develop -c zsh -lc 'pnpm nix:sync-pnpm-deps-hash'
```

### 12.4 `pnpm install` が build script 審査で止まる

このリポジトリでは supply-chain policy が有効です。正当な理由があるなら内容を確認したうえで:

```sh
nix develop -c zsh -lc 'pnpm approve-builds'
```

実行後は `pnpm-workspace.yaml` の差分をレビューしてください。

### 12.5 WSL で desktop アプリが出ない

- `WSLg` が有効か
- リポジトリを WSL 側に置いているか
- `pnpm doctor:wsl` で問題が出ないか

を確認してください。

### 12.6 CSP や style 注入で macOS desktop が怪しい

最終確認は Playwright web preview ではなく、macOS 上での:

```sh
nix develop -c zsh -lc 'pnpm verify:tauri:csp'
```

です。Tauri / WebKit の実ランタイムでしか出ない問題があります。

## 13. リリース導線

日常開発者が全部覚える必要はありませんが、入口は知っておくべきです。

VS Code 標準フロー:

1. `main` に checkout して `git pull --ff-only origin main`
2. `Verify CI`
3. `Release Desktop Dry Run`
4. `Deploy Desktop Release`

詳しい runbook は [`docs/release-checklist.md`](./release-checklist.md) を参照してください。

補足:

- 自動化は `main` 上で version を確定し、その commit に `vX.Y.Z` タグを付けます
- `Release Desktop Dry Run` は `main` が `origin/main` と一致している状態で実行してください
- `release-tauri-desktop` は tag が `main` 系列の commit を指している場合のみ継続します
- GitHub Release は全 artifact upload 完了まで draft のまま保持され、最後に publish されます
- signing key などの GitHub secret 前提があります
- push 済みで失敗した場合は、履歴を書き換えて巻き戻すより follow-up commit 修正が基本です

## 14. 迷ったときの判断基準

### 14.1 どこに実装するか迷う

- 純粋なルールなら `domain`
- 共有状態なら `application/state`
- browser / Tauri API 境界なら `infrastructure`
- 見た目とイベント結線なら `presentation`

### 14.2 どこまで verify するか迷う

保守的に考えて、ひとつ上の verify を回してください。

例:

- UI を少し触っただけでも `pnpm verify:ui`
- 設定ファイルを触ったら `pnpm verify` 以上
- release / dependency / workflow なら `pnpm verify:ci`

### 14.3 変更が広がりそうで不安

次の順で確認するとだいたい整理できます。

1. 変更の中心は `domain` か `presentation` か
2. 外部データ境界を跨ぐか
3. Tauri / Nix / CI に波及するか
4. 追加すべき test は unit / component / E2E / repo test のどれか

## 15. 関連ドキュメント

作業内容によっては、次の文書も有用です。

- [`README.md`](../README.md)
- [`docs/release-checklist.md`](./release-checklist.md)
- [`docs/static-css-architecture.md`](./static-css-architecture.md)
- [`docs/static-styling-status.md`](./static-styling-status.md)
- [`docs/style-runtime-transition-notes.md`](./style-runtime-transition-notes.md)
- [`docs/bg-edit-mode-design.md`](./bg-edit-mode-design.md)
- [`docs/nesdev-screen-rendering-context.md`](./nesdev-screen-rendering-context.md)
- [`docs/csp-style-src-hardening-todo.md`](./csp-style-src-hardening-todo.md)

この文書に足りない情報が見つかったら、README に追記する前に「人が次に迷うのはどこか」を考えて、このマニュアルへ戻していくのがよいです。
