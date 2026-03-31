# NESDOT

NESDOT は、NES / ファミコンの画面制約を意識しながらドット絵を作るためのエディタです。
Tauri + React + TypeScript で構成されており、デスクトップアプリとして動かしつつ、フロントエンド単体でも確認できます。

## このプロジェクトでできること

### 1. スプライトを NES 風の制約で編集する

- 64 枚のスプライトスロットを持ちます
- 各スプライトは `8x8` または `8x16` で編集できます
- 描画ツールは `ペン` と `消しゴム`
- スプライトのクリアができます
- `8x8` 単位でブロックをドラッグして並べ替えできます
- パレットは 4 組あり、各パレットは 4 色スロットです
- `slot0` は透明扱いで、実際には描画されません

### 2. スプライトを画面に配置する

- 画面サイズは `256x240`
- 作成済みスプライトを X / Y 座標付きで配置できます
- 配置済みスプライトの一覧表示、位置変更、削除ができます
- 画面モードではスプライト総数とスキャンライン制約を検査します

### 3. NES 向けの出力を行う

- スプライト単位で `CHR` をエクスポートできます
- スプライト / 画面を `PNG` / `SVG` に出力できます
- プロジェクト全体を `JSON` で保存 / 復元できます

## 再現している制約

- スプライトの色は 4 色パレット単位で扱う
- パレットは 4 組
- 透明色は各パレットの `slot0`
- 画面上に配置できるスプライト総数は最大 `64`
- 同一スキャンライン上のスプライト数は最大 `8`
- スプライトサイズは `8x8` または `8x16`

## 現状の制限

- 背景タイル (`32x30` の 8x8 背景) のデータ構造はありますが、UI から編集する機能はまだありません
- 画面モードは主に「スプライト配置プレビュー」と「制約チェック」に使う実装です
- 位置の画面外チェックは描画時にクリップされますが、追加時の厳密な拒否ロジックは無効化されています
- 自動永続化のための IndexedDB 実装はありますが、現在のストアでは無効化されており、実用上は JSON 保存 / 復元を使う形です

## セットアップ

### 前提

このリポジトリの開発コマンドは flake dev shell 内で実行します。
ホスト環境から直接 `node`, `pnpm`, `cargo`, `tauri`, `vite`, `tsc` などを実行しないでください。

必要なもの:

- Nix
- Git

### 初回セットアップ

```sh
nix develop
pnpm install
```

ワンショットで実行する場合は次の形式を使います。

```sh
nix develop -c zsh -lc 'pnpm install'
```

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

### Lint

```sh
nix develop -c zsh -lc 'pnpm lint'
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

## 推奨検証フロー

通常のコード変更:

```sh
nix develop -c zsh -lc 'pnpm verify'
```

UI 変更:

```sh
nix develop -c zsh -lc 'pnpm verify:ui'
```

UI の表示・操作フローに影響する変更:

```sh
nix develop -c zsh -lc 'pnpm verify:full'
```

## 開発方針

このリポジトリでは、機械的に強制できる品質ゲートを優先します。

- `lint`
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

- UI: React 19
- 言語: TypeScript
- ビルド: Vite
- デスクトップ化: Tauri 2
- 状態管理: Zustand
- スタイル: Emotion
- ランタイムバリデーション: Zod
- 関数型ユーティリティ: fp-ts
- テスト: Vitest / Playwright

## コード構成

- `src/App.tsx`
  - 画面モード / スプライトモードの切り替え
- `src/components/SpriteMode.tsx`
  - スプライト編集 UI と各種エクスポート
- `src/components/ScreenMode.tsx`
  - 画面へのスプライト配置と制約チェック
- `src/components/hooks/useSpriteCanvas.ts`
  - スプライト描画、ペン / 消しゴム、8x8 ブロック並べ替え
- `src/components/hooks/useScreenCanvas.ts`
  - 画面プレビュー描画
- `src/components/PalettePicker.tsx`
  - 4 組の NES パレット編集 UI
- `src/store/projectState.ts`
  - プロジェクト状態、画面合成、スプライト / パレットの型定義
- `src/nes/chr.ts`
  - 8x8 / 8x16 スプライトの CHR 変換
- `src/hooks/useExportImage.ts`
  - CHR / PNG / SVG / JSON の出力
- `src/hooks/useImportImage.ts`
  - JSON の復元
- `src-tauri/`
  - Tauri 側のエントリポイントと設定

## 実装メモ

- `nesdev` の仕様をもとにした画面描画コンテキスト: [`docs/nesdev-screen-rendering-context.md`](docs/nesdev-screen-rendering-context.md)

## ライセンス

Apache License 2.0
