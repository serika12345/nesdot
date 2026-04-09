# NESDOT

NESDOT は、NES / ファミコンの画面制約を意識しながらドット絵を作るためのエディタです。
Tauri + React + TypeScript で構成されており、デスクトップアプリとして動かしつつ、フロントエンド単体でも確認できます。

## このプロジェクトでできること

### 1. スプライト編集モード

- 64 枚のスプライトスロットを編集できます
- 描画ツールは `ペン` / `消しゴム` / `クリア`
- `8x8` 単位でブロックをドラッグして並べ替えできます
- スプライトごとにパレット (0..3) を選択できます
- CHR / PNG / SVG の書き出し、プロジェクト JSON 保存 / 復元ができます

### 2. キャラクター編集モード

- キャラクターセットの作成 / 選択 / リネーム / 削除ができます
- 合成モードでは、スプライトライブラリからステージへドラッグ配置できます
- 配置済みスプライトの移動、レイヤー変更、削除ができます
- 分解モードでは、分解キャンバスに描画して切り取り領域を定義し、既存スプライト再利用と空きスロット割り当てを解析して反映できます
- キャラクター単位で PNG / SVG / キャラクター JSON を書き出せます

### 3. 画面配置モード

- 画面サイズ `256x240` 上にスプライトを配置できます
- 単体スプライト追加に加えて、キャラクターセットをまとめて配置できます
- 選択中スプライトの座標、優先度、反転 (H / V)、削除ができます
- 複数選択したスプライトのグループ移動ができます
- 画面プレビューはズーム / パンに対応します
- PNG / SVG の書き出し、プロジェクト JSON 保存 / 復元ができます

## 再現している制約

- スプライトの色は 4 色パレット単位で扱う
- スプライトパレットは 4 組
- 透明色は各パレットの `slot0`
- 画面上に配置できるスプライト総数は最大 `64`
- 同一スキャンライン上のスプライト数は最大 `8`
- スプライトサイズはプロジェクト単位で `8x8` または `8x16`

## 現状の制限

- 背景タイル (`32x30` の 8x8 背景) のデータ構造はありますが、UI から編集する機能はまだありません
- 画面配置モードはスプライト配置と制約チェックが中心で、背景編集は扱いません
- 一部入力では画面外座標を厳密拒否せず、描画時にクリップされる経路があります
- 自動永続化のための IndexedDB 実装はありますが、現在のストアでは無効化されており、実用上は JSON 保存 / 復元を使う形です

## セットアップ

### 前提

このリポジトリの開発コマンドは flake dev shell 内で実行します。
ホスト環境から直接 `node`, `pnpm`, `cargo`, `tauri`, `vite`, `tsc` などを実行しないでください。

必要なもの:

- Nix
- Git

推奨の補助ツール:

- direnv + nix-direnv
- VS Code + Remote - WSL (WSL 利用時)

### 初回セットアップ

```sh
nix develop
pnpm install
```

ワンショットで実行する場合は次の形式を使います。

```sh
nix develop -c zsh -lc 'pnpm install'
```

`direnv` を使う場合は、clone 後に一度だけ次を実行してください。

```sh
direnv allow
```

## WSL での開発

WSL は Linux ホストとして扱います。Nix を導入したうえで、Windows 側
ではなく WSL 側のファイルシステムで作業してください。

### 推奨手順

1. `WSL2` を使う
2. `/etc/wsl.conf` で `systemd=true` を有効にする
3. デスクトップアプリを起動する場合は `WSLg` を有効にする
4. リポジトリは `/mnt/c/...` ではなく `~/src/...` などに clone する
5. VS Code では `Remote - WSL` でこのフォルダを開く
6. `.envrc` を使う場合は `direnv allow` を実行する
7. 状態確認は `nix develop -c zsh -lc 'pnpm doctor:wsl'` を使う

`systemd` を有効にする例:

```ini
[boot]
systemd=true
```

設定変更後は Windows 側から `wsl --shutdown` を実行して WSL を再起動し
てください。

### サポート範囲

| 項目                                                             | WSL での扱い                        |
| ---------------------------------------------------------------- | ----------------------------------- |
| `pnpm dev` / `pnpm lint` / `pnpm typecheck:safety` / `pnpm test` | 正式サポート                        |
| `pnpm test:e2e` / `pnpm test:e2e:console`                        | サポート                            |
| `pnpm start`                                                     | `WSLg` が有効な場合のみ正式サポート |
| `nix build` / `nix build .#desktop` / `nix build .#web`          | Linux 向け出力としてサポート        |
| Windows ネイティブ配布物の生成                                   | サポート対象外                      |

このリポジトリでは pnpm のサプライチェーン対策を有効にしています。

- 依存パッケージが未審査の install / postinstall script を持っていると `pnpm install` は失敗します
- 公開から 24 時間未満の新規バージョンは解決対象から外れます
- 推移依存が git URL / 直 tarball URL からコードを引くことを禁止しています

正当な理由で依存の build script を許可する必要がある場合は、内容を確認したうえで次を実行し、生成された `pnpm-workspace.yaml` の差分をレビューしてコミットしてください。

```sh
nix develop -c zsh -lc 'pnpm approve-builds'
```

## 開発コマンド

### フロントエンドのみ起動

```sh
nix develop -c zsh -lc 'pnpm dev'
```

### Tauri デスクトップアプリを起動

```sh
nix develop -c zsh -lc 'pnpm start'
```

### ビルド

```sh
nix develop -c zsh -lc 'pnpm build'
```

`base` パスは `VITE_BASE_PATH` だけで決まります。

- 未指定: `/`
- GitHub Pages: workflow で `VITE_BASE_PATH=/<repo-name>/` を明示
- Desktop 配布物: workflow で `VITE_BASE_PATH=/` を明示

### Nix パッケージビルド (macOS / Linux)

`nix build` でホスト OS 向けのデスクトップバイナリをビルドできます。

```sh
nix build
```

出力:

- `./result/bin/nesdot`

Web 配布物のみをビルドしたい場合:

```sh
nix build .#web
```

出力:

- `./result/dist`

`pnpm-lock.yaml` を更新したあとに `flake.nix` の `fetchPnpmDeps` hash がずれていないか、まず軽く確認する場合は次を使います。

```sh
nix develop -c zsh -lc 'pnpm nix:check-pnpm-deps-hash'
```

この確認は `nix build .#pnpmDeps --no-link` だけを実行し、hash がずれていれば non-zero で失敗します。CI でもこの軽量チェックを先に実行します。

hash がずれていた場合は、次で追従できます。

```sh
nix develop -c zsh -lc 'pnpm nix:sync-pnpm-deps-hash'
```

この script は `nix build .#pnpmDeps --no-link` を実行し、固定ハッシュ mismatch の `got:` 値を使って `flake.nix` を更新し、最後にもう一度 build して確認します。

明示的にデスクトップビルドを指定する場合:

```sh
nix build .#desktop
```

注記:

- Linux ビルドは Linux ホスト上で、macOS ビルドは macOS ホスト上で実行してください (クロスビルドは想定していません)。

### Lint

```sh
nix develop -c zsh -lc 'pnpm lint'
```

### Format

```sh
nix develop -c zsh -lc 'pnpm format'
```

### Format Check

```sh
nix develop -c zsh -lc 'pnpm format:check'
```

### Security Verification

```sh
nix develop -c zsh -lc 'pnpm verify:security'
```

この検証では、依存サプライチェーン設定、CI / release workflow の `--frozen-lockfile`、Tauri updater 設定、アプリ内の JSON 復元境界を機械的に確認します。

### CVE Audit

```sh
nix develop -c zsh -lc 'pnpm verify:cve'
```

この監査では `pnpm audit` と `cargo audit` を実行し、既知 advisory は `scripts/cve-audit-baseline.json` を baseline として管理します。baseline にない新規 advisory が出た場合だけ失敗します。

インデント、改行コード、末尾改行、末尾空白などのエディタ既定値は `.editorconfig` で統一しています。
行幅は `.editorconfig` の `max_line_length` を source of truth にし、コード整形そのものは引き続き Prettier を基準にします。
VS Code の保存時フォーマットは workspace の Prettier と Rust formatter を使うように設定しています。

### Rust Native Verification

```sh
nix develop -c zsh -lc 'pnpm rust:fmt:check'
nix develop -c zsh -lc 'pnpm rust:check'
nix develop -c zsh -lc 'pnpm rust:lint'
nix develop -c zsh -lc 'pnpm rust:test'
nix develop -c zsh -lc 'pnpm verify:rust'
```

### 型安全チェック

```sh
nix develop -c zsh -lc 'pnpm typecheck:safety'
```

### Unit Test

```sh
nix develop -c zsh -lc 'pnpm test'
```

### Browser Console / Page Error Check

```sh
nix develop -c zsh -lc 'pnpm test:e2e:console'
```

### Full E2E

```sh
nix develop -c zsh -lc 'pnpm test:e2e'
```

### Playwright ブラウザの初回セットアップ

```sh
nix develop -c zsh -lc 'pnpm e2e:install'
```

## 推奨検証フロー

通常のコード変更:

```sh
nix develop -c zsh -lc 'pnpm verify'
```

依存関係、workflow、updater 設定、JSON import / restore 境界を触った場合:

```sh
nix develop -c zsh -lc 'pnpm verify:security'
```

依存関係や toolchain の CVE 状況を確認したい場合:

```sh
nix develop -c zsh -lc 'pnpm verify:cve'
```

UI 変更:

```sh
nix develop -c zsh -lc 'pnpm verify:ui'
```

UI の表示・操作フローに影響する変更:

```sh
nix develop -c zsh -lc 'pnpm verify:full'
```

`src-tauri` や Rust 向けの build / release tooling を変更した場合:

```sh
nix develop -c zsh -lc 'pnpm verify:rust'
```

CI では通常の verify job に加えて `pnpm verify:cve` を走らせ、新しい advisory を pull request / push の段階で検出します。

VS Code では `Terminal: Run Task` から `Verify Security`, `Verify CVE`, `Verify`, `Verify UI`, `Verify Full`, `Verify Rust`, `Run Unit Tests`, `Run Console E2E`, `Run Full E2E`, `Format Check` を直接実行できます。
`Run and Debug` では `Launch Frontend (Chrome, 1420)`、`Launch Tauri Desktop`、`Launch Tauri Desktop + Attach Frontend` を使い分けできます。
Rust 側でブレークポイントを使う場合は、推奨拡張の `CodeLLDB` を入れたうえで `Launch Tauri Desktop` を使ってください。
この起動は `Run Frontend Dev Server` と Rust デバッグ用ビルドを Nix dev shell 内で準備し、その後 VS Code から `src-tauri/target/debug/nesdot` を LLDB で起動します。
macOS では CodeLLDB が bundled backend から `debugserver` を解決できず `executable doesn't exist: '(empty)'` になる場合があるため、workspace 設定で system `debugserver` も明示しています。

## 自動リリース

`develop -> main` マージ、タグ作成 (`vX.Y.Z`)、リリースワークフロー起動までを自動化できます。

デフォルトは `0.0.1` ずつインクリメント (patch bump) です。

```sh
nix develop -c zsh -lc 'pnpm release:auto'
```

ドライラン:

```sh
nix develop -c zsh -lc 'pnpm release:auto:dry-run'
```

主なオプション:

- `--part=patch|minor|major` (デフォルト: `patch`)
- `--version=x.y.z` (明示指定、`--part` より優先)
- `--source=develop` / `--target=main` / `--remote=origin`
- `--skip-checks` / `--skip-e2e-console`

例:

```sh
nix develop -c zsh -lc 'pnpm release:auto -- --part=minor'
nix develop -c zsh -lc 'pnpm release:auto -- --version=0.2.0'
```

## 自動アップデート (Desktop)

このプロジェクトは Tauri Updater に対応しています。
デスクトップ起動時に更新を確認し、更新が見つかった場合はダウンロードと再起動を案内します。
必要に応じて `ヘルプ > 更新を確認` から手動で再チェックできます。

- 更新チェック先: `https://github.com/paseri3739/nesdot/releases/latest/download/latest.json`
- 署名検証: `src-tauri/tauri.conf.json` の updater `pubkey`

### 手元での確認

- Tauri アプリとして起動した状態で `ヘルプ > 更新を確認` を選ぶと、その場で更新確認を再実行できます。
- 更新がない場合も「最新の状態です」ダイアログが出るため、確認処理自体が動いたことを手元で確認できます。
- 開発時は `nix develop -c zsh -lc 'pnpm start'` で Tauri dev を起動して試してください。

### 初回セットアップ (リリース署名キー)

Updater の署名は必須です。初回のみ秘密鍵を生成して GitHub Actions secret に登録してください。

```sh
nix develop -c zsh -lc 'pnpm tauri signer generate -w ~/.tauri/nesdot-updater.key --ci'
gh secret set TAURI_SIGNING_PRIVATE_KEY -R paseri3739/nesdot < ~/.tauri/nesdot-updater.key
```

秘密鍵を失うと既存ユーザー向けアップデート署名を継続できなくなるため、安全な場所にバックアップしてください。

## 開発方針

このリポジトリでは、機械的に強制できる品質ゲートを優先します。

- `lint`
- `format:check`
- `typecheck:safety`
- `test`
- `test:e2e:console`
- 必要に応じて `test:e2e`

設計上の基本方針:

- 関数型スタイルを優先する
- 状態更新は破壊的変更を避け、不変更新を優先する
- ロジックは副作用を分離し、可能な限り純粋関数として記述する
- 外部入力は `zod` で検証してから状態やドメインロジックに渡す

詳細な作業ルールは `AGENTS.md` を参照してください。

## 技術構成

- UI: React 19 + MUI 7
- 言語: TypeScript
- ビルド: Vite
- デスクトップ化: Tauri 2
- 状態管理: Zustand
- スタイル: Emotion (MUI)
- キャンバス: Fabric.js (キャラクター合成キャンバス)
- ランタイムバリデーション: Zod
- 関数型ユーティリティ: fp-ts
- テスト: Vitest / Playwright

## コード構成

- `src/main.tsx`
  - ThemeProvider / CssBaseline の適用とアプリ起動
- `src/presentation/App.tsx`
  - 3 モード (スプライト編集 / キャラクター編集 / 画面配置) の切り替え
- `src/presentation/components/spriteMode/`
  - スプライト編集 UI、描画ツール、キャンバス
- `src/presentation/components/characterMode/`
  - キャラクター合成 / 分解 UI、ライブラリ、ステージ操作
- `src/presentation/components/screenMode/`
  - 画面配置 UI、選択編集、グループ移動、プレビュー
- `src/presentation/components/common/ProjectActions.tsx`
  - 共有 (エクスポート) / 復元アクション UI
- `src/application/state/projectStore.ts`
  - プロジェクト状態 (sprites / screen / nes)
- `src/application/state/characterStore.ts`
  - キャラクターセット状態
- `src/domain/`
  - CHR 変換、レンダリング、制約判定、キャラクター分解などのドメインロジック
- `src/infrastructure/browser/useExportImage.ts`
  - CHR / PNG / SVG / JSON の書き出し
- `src/infrastructure/browser/useImportImage.ts`
  - zod 検証付き JSON 復元
- `src/infrastructure/browser/useDesktopAutoUpdate.ts`
  - デスクトップ起動時の自動アップデート確認
- `src-tauri/`
  - Tauri 側エントリポイント、権限設定、ビルド設定

## 実装メモ

- `nesdev` の仕様をもとにした画面描画コンテキスト: [`docs/nesdev-screen-rendering-context.md`](docs/nesdev-screen-rendering-context.md)

## ライセンス

Apache License 2.0
