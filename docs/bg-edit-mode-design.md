# BG 編集モードと画面配置 BG 編集の現状整理（2026-04 時点）

## この文書の役割

このファイルは、BG 関連機能の現在の実装境界を整理するためのメモです。現在のアプリは正規化済み `ProjectState` をプロジェクト状態の正本にし、NES raw state は描画や export 用の projection として導出します。

## 現在のアーキテクチャ

- `WorkMode` には `bg` が追加済みで、[../src/presentation/App.tsx](../src/presentation/App.tsx)、[../src/presentation/components/common/ui/menu/MenuBar.tsx](../src/presentation/components/common/ui/menu/MenuBar.tsx)、[../src-tauri/src/lib.rs](../src-tauri/src/lib.rs) から切り替えられます。
- BG モード本体は [../src/presentation/components/bgMode/ui/core/BgMode.tsx](../src/presentation/components/bgMode/ui/core/BgMode.tsx) / [../src/presentation/components/bgMode/ui/core/BgModeScreen.tsx](../src/presentation/components/bgMode/ui/core/BgModeScreen.tsx) / [../src/presentation/components/bgMode/ui/core/BgModeWorkspace.tsx](../src/presentation/components/bgMode/ui/core/BgModeWorkspace.tsx) です。
- 画面配置モードの BG 編集は [../src/presentation/components/screenMode/ui/panels/ScreenModeWorkspacePanel.tsx](../src/presentation/components/screenMode/ui/panels/ScreenModeWorkspacePanel.tsx) と [../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts](../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts) が担当します。
- 実アプリのストアは [../src/application/state/projectStore.ts](../src/application/state/projectStore.ts) の `ProjectState` です。背景タイルの正本は `backgroundTiles`、画面上の背景配置と属性は `screen.background` です。
- NES の `chrBytes` / `nameTable` / `attributeTable` / `oam` は [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts) で導出します。UI や保存形式は raw NES state を直接持ちません。

## 実装済みの振る舞い

### 1. BG 編集モード

BG 編集モードは `backgroundTiles` に直接接続されています。

- 256 枚の BG タイル一覧を表示し、選択中タイルを編集できます
- タイル編集は選択中 `BackgroundTile` の pixel matrix を不変更新し、`backgroundTiles` に書き戻します
- UI としてはツールメニューの開閉、`pen` / `eraser` の切り替え、プレビュー用パレット切り替えがあります
- 選択中タイルの CHR / PNG / SVG export は、project state から導出したタイルと palette を使います
- E2E は [../e2e/bg-mode.spec.ts](../e2e/bg-mode.spec.ts) が担当します

### 2. BG モードで現在できること / できないこと

現在の BG モードは「タイルのピクセル編集」に絞った最小実装です。

- できること: タイル選択、1 ピクセルずつの描画、消しゴム、プレビュー色の切り替え、選択中タイルの CHR / PNG / SVG export
- できないこと: タイル並べ替え、削除、BG モード内からのプロジェクト JSON 保存 / 復元、画面配置ステージへの直接ドラッグ配置

重要な現状差分として、`activePaletteIndex` は表示用のローカル state であり、描画色そのものの選択ではありません。

- `pen` は現在 `color index = 1` を打ちます
- `eraser` は `color index = 0` を打ちます
- UI から `color index = 2` / `3` を直接打つ導線はまだありません

### 3. 画面配置モードの BG 編集

画面配置モードには BG 編集導線が追加済みです。ただし、常設トグルではなく、ダイアログ起点の一時モードです。

- 上部操作列に `BGタイル追加` ボタンがあります
- ボタンから [../src/presentation/components/screenMode/ui/dialogs/ScreenModeBackgroundTilePickerDialog.tsx](../src/presentation/components/screenMode/ui/dialogs/ScreenModeBackgroundTilePickerDialog.tsx) を開きます
- ダイアログには `BGタイル` / `BG属性` の 2 モードがあります
- `BGタイル` でタイルを選ぶと、一時的に `bgTile` モードへ入り、`8x8` スナップ済みプレビューをステージ上に表示します
- ステージをクリックすると `screen.background.tileIndices` が更新され、配置完了後は `sprite` モードへ戻ります
- `BG属性` でパレットを選ぶと、一時的に `bgPalette` モードへ入り、`screen.background.paletteIndices` を `16x16` 領域単位で pointer down / move で塗れます
- pointer up 後は `sprite` モードへ戻ります
- スプライト外枠表示 / `#表示` トグルは BG 編集中も上部に表示されたままです

### 4. 画面配置モードで未実装の UI 項目

- `スプライト` / `BGタイル` / `BG属性` の常設トグル
- BG 編集中の右クリックスポイト
- BG 編集専用の常設サイドバー

現在の背景編集中の右クリックは、「sprite 用コンテキストメニューを開かない」ために抑止しているだけです。

## domain 側の主要部品

- [../src/domain/project/project.ts](../src/domain/project/project.ts): `backgroundTiles` と `screen.background` を持つ正規化 state
- [../src/domain/project/projectSchema.ts](../src/domain/project/projectSchema.ts): project JSON schema
- [../src/domain/screen/backgroundLayout.ts](../src/domain/screen/backgroundLayout.ts): `screen.background.tileIndices` の配置 helper
- [../src/domain/screen/backgroundPalette.ts](../src/domain/screen/backgroundPalette.ts): `screen.background.paletteIndices` の palette helper
- [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts): project state から NES raw state を導出
- [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts): project state / projection を使った最終描画
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts): `scanProjectStateSpriteConstraints`

## 現在の保存形式

プロジェクト JSON は `formatVersion: 2` の `ProjectState` です。

- [../src/infrastructure/browser/useExportImage.ts](../src/infrastructure/browser/useExportImage.ts) の `exportJSON` は `spriteTiles` / `backgroundTiles` / `screen` / `palettes` / `ppuControl` を保存します
- [../src/infrastructure/browser/useImportImage.ts](../src/infrastructure/browser/useImportImage.ts) は `ProjectStateSchema` で検証した project JSON だけを読み込みます
- 旧 `sprites` / `nes` 形状の JSON 互換 importer はありません
- キャラクターセットは既存導線との互換のため、project JSON に任意の `characters` として同梱できます

## 現在の回帰テスト

BG 関連は複数層でテストされています。

- BG モード E2E: [../e2e/bg-mode.spec.ts](../e2e/bg-mode.spec.ts)
- 画面配置 BG 導線 E2E: [../e2e/screen-mode.spec.ts](../e2e/screen-mode.spec.ts)
- 正規化レイヤーの test: [../src/domain/screen/backgroundLayout.test.ts](../src/domain/screen/backgroundLayout.test.ts), [../src/domain/screen/backgroundPalette.test.ts](../src/domain/screen/backgroundPalette.test.ts), [../src/domain/nes/projection.test.ts](../src/domain/nes/projection.test.ts), [../src/domain/project/projectSchema.test.ts](../src/domain/project/projectSchema.test.ts)

## 今後の課題

### 1. BG モードの色編集を 4 値対応にする

現在は `0` と `1` しか打てません。BG タイル編集としては `0..3` の color index をどう選ばせるかを別途設計する必要があります。

### 2. BG 編集 UX の追加要否を決める

必要なら次を別タスクで足します。

- 常設トグル型の編集対象切り替え
- スポイト
- BG 編集専用の状態表示
- BG モードでのプロジェクト JSON 保存 / 復元導線
