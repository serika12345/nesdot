# BG 編集モードと画面配置 BG 編集の現状整理（2026-04 時点）

## この文書の役割

このファイルは、BG 関連機能の「将来案」ではなく、現在のアプリで何が実装済みで、何が domain 側だけに存在し、何がまだ未着手かを整理するためのメモです。

旧版で前提にしていた「v2 正規化 state へ全面移行する設計」は、現時点では部分実装に留まっています。実装と文書がずれやすい箇所なので、ここでは現在形で記述します。

## 現在のアーキテクチャ

- `WorkMode` には `bg` が追加済みで、[../src/presentation/App.tsx](../src/presentation/App.tsx)、[../src/presentation/components/common/ui/menu/MenuBar.tsx](../src/presentation/components/common/ui/menu/MenuBar.tsx)、[../src-tauri/src/lib.rs](../src-tauri/src/lib.rs) から切り替えられます。
- BG モード本体は [../src/presentation/components/bgMode/ui/core/BgMode.tsx](../src/presentation/components/bgMode/ui/core/BgMode.tsx) / [../src/presentation/components/bgMode/ui/core/BgModeScreen.tsx](../src/presentation/components/bgMode/ui/core/BgModeScreen.tsx) / [../src/presentation/components/bgMode/ui/core/BgModeWorkspace.tsx](../src/presentation/components/bgMode/ui/core/BgModeWorkspace.tsx) です。
- 画面配置モードの BG 編集は [../src/presentation/components/screenMode/ui/panels/ScreenModeWorkspacePanel.tsx](../src/presentation/components/screenMode/ui/panels/ScreenModeWorkspacePanel.tsx) と [../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts](../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts) が担当します。
- 実アプリのストアはまだ legacy `ProjectState` ([../src/domain/project/project.ts](../src/domain/project/project.ts)) を使っています。背景の正本は `screen.background` ではなく、`nes.chrBytes` / `nes.nameTable` / `nes.attributeTable` です。
- `ProjectStateV2` / `ProjectStateV2Schema` / `buildNesProjection` / `renderProjectStateV2ToHexArray` は存在しますが、現時点では domain / test 用です。
- 保存 / 復元は [../src/infrastructure/browser/useExportImage.ts](../src/infrastructure/browser/useExportImage.ts) と [../src/infrastructure/browser/useImportImage.ts](../src/infrastructure/browser/useImportImage.ts) が legacy `ProjectState` JSON を扱います。

## 実装済みの振る舞い

### 1. BG 編集モード

BG 編集モードは mock ではなく、すでに実データへ接続されています。

- 256 枚の BG タイル一覧を表示し、選択中タイルを編集できます
- タイル一覧は `nes.chrBytes` から都度 decode しており、[../src/domain/nes/backgroundEditing.ts](../src/domain/nes/backgroundEditing.ts) の `decodeBackgroundTileAtIndex` を使います
- タイル編集は `replaceBackgroundTilePixel` を通して `nes.chrBytes` に書き戻します
- UI としてはツールメニューの開閉、`pen` / `eraser` の切り替え、プレビュー用パレット切り替えがあります
- BG モードでは選択中タイルの CHR / PNG / SVG export は使えますが、プロジェクト JSON の保存 / 復元は出していません
- E2E は [../e2e/bg-mode.spec.ts](../e2e/bg-mode.spec.ts) が担当します

### 2. BG モードで現在できること / できないこと

現在の BG モードは「タイルのピクセル編集」に絞った最小実装です。

- できること: タイル選択、1 ピクセルずつの描画、消しゴム、プレビュー色の切り替え、選択中タイルの CHR / PNG / SVG export
- できないこと: タイル並べ替え、削除、プロジェクト JSON の保存 / 復元、画面配置ステージへの直接ドラッグ配置

重要な現状差分として、`activePaletteIndex` は表示用のローカル state であり、描画色そのものの選択ではありません。

- `pen` は現在 `color index = 1` を打ちます
- `eraser` は `color index = 0` を打ちます
- UI から `color index = 2` / `3` を直接打つ導線はまだありません

### 3. 画面配置モードの BG 編集

画面配置モードには BG 編集導線が追加済みです。ただし、旧設計で想定していた「常設トグルで編集対象を維持する UI」ではなく、ダイアログ起点の一時モードになっています。

- 上部操作列に `BGタイル追加` ボタンがあります
- ボタンから [../src/presentation/components/screenMode/ui/dialogs/ScreenModeBackgroundTilePickerDialog.tsx](../src/presentation/components/screenMode/ui/dialogs/ScreenModeBackgroundTilePickerDialog.tsx) を開きます
- ダイアログには `BGタイル` / `BG属性` の 2 モードがあります
- `BGタイル` でタイルを選ぶと、一時的に `bgTile` モードへ入り、`8x8` スナップ済みプレビューをステージ上に表示します
- ステージをクリックすると `nes.nameTable` が更新され、配置完了後は `sprite` モードへ戻ります
- `BG属性` でパレットを選ぶと、一時的に `bgPalette` モードへ入り、`16x16` 領域を pointer down / move で塗れます
- pointer up 後は `sprite` モードへ戻ります
- スプライト外枠表示 / `#表示` トグルは BG 編集中も上部に表示されたままです

### 4. 画面配置モードで未実装の旧設計項目

旧設計に書いていた内容のうち、現時点で未実装なのは次です。

- `スプライト` / `BGタイル` / `BG属性` の常設トグル
- BG 編集中の右クリックスポイト
- BG 編集専用の常設サイドバー
- `screen.background` を直接編集する正規化 state ベースの UI

現在の背景編集中の右クリックは、「sprite 用コンテキストメニューを開かない」ために抑止しているだけです。

## domain 側で整備済みのもの

アプリ本体は legacy state のままですが、将来の正規化移行に向けた pure function 群はすでにあります。

### 1. BG 編集 helper

[../src/domain/nes/backgroundEditing.ts](../src/domain/nes/backgroundEditing.ts) に次があります。

- `decodeBackgroundTileAtIndex`
- `replaceBackgroundTileAtIndex`
- `replaceBackgroundTilePixel`
- `setNameTableTileAtPixel`
- `setAttributeTablePaletteAtPixel`

このうち UI が実際に使っているのは、現時点ではここに並んだ legacy `nes.*` 更新関数です。

### 2. 正規化 v2 state と projection

[../src/domain/project/projectV2.ts](../src/domain/project/projectV2.ts) と [../src/domain/project/projectV2Schema.ts](../src/domain/project/projectV2Schema.ts) には、`backgroundTiles` と `screen.background` を持つ正規化 state があります。

さらに、次の pure function も存在します。

- [../src/domain/screen/backgroundLayout.ts](../src/domain/screen/backgroundLayout.ts)
- [../src/domain/screen/backgroundPalette.ts](../src/domain/screen/backgroundPalette.ts)
- [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts)
- [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `renderProjectStateV2ToHexArray`
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts) の `scanProjectStateV2SpriteConstraints`

ただし、これらはまだ UI の source of truth ではありません。

## 現在の保存形式

保存形式はまだ v2 ではありません。

- [../src/infrastructure/browser/useExportImage.ts](../src/infrastructure/browser/useExportImage.ts) の `exportJSON` は legacy `ProjectState` をそのまま JSON 化します
- [../src/infrastructure/browser/useImportImage.ts](../src/infrastructure/browser/useImportImage.ts) も legacy `ProjectState` を zod で検証して読み込みます
- `formatVersion: 2` はアプリの保存導線ではまだ使っていません
- `screen.background` は app save file の正本ではありません

つまり、`ProjectStateV2` は「導入済みの保存形式」ではなく、「並行整備済みの候補」です。

## 現在の回帰テスト

BG 関連はすでに複数層でテストされています。

- BG モード E2E: [../e2e/bg-mode.spec.ts](../e2e/bg-mode.spec.ts)
- 画面配置 BG 導線 E2E: [../e2e/screen-mode.spec.ts](../e2e/screen-mode.spec.ts)
- BG 編集 helper の unit test: [../src/domain/nes/backgroundEditing.test.ts](../src/domain/nes/backgroundEditing.test.ts)
- 正規化レイヤーの test: [../src/domain/screen/backgroundLayout.test.ts](../src/domain/screen/backgroundLayout.test.ts), [../src/domain/screen/backgroundPalette.test.ts](../src/domain/screen/backgroundPalette.test.ts), [../src/domain/nes/projection.test.ts](../src/domain/nes/projection.test.ts), [../src/domain/project/projectV2Schema.test.ts](../src/domain/project/projectV2Schema.test.ts)

## 今後の課題

### 1. runtime state を v2 に移行するかどうかを決める

正規化方針を継続するなら、Zustand ストア、保存形式、import/export を `ProjectStateV2` に寄せる必要があります。

### 2. UI を pure function 側へ寄せる

現在の画面配置 BG 編集は `nes.nameTable` / `nes.attributeTable` を直接更新しています。正規化へ寄せるなら、`backgroundLayout.ts` / `backgroundPalette.ts` を UI から使う形に切り替える必要があります。

### 3. BG モードの色編集を 4 値対応にする

現在は `0` と `1` しか打てません。BG タイル編集としては `0..3` の color index をどう選ばせるかを別途設計する必要があります。

### 4. BG 編集 UX の追加要否を決める

必要なら次を別タスクで足します。

- 常設トグル型の編集対象切り替え
- スポイト
- BG 編集専用の状態表示
- BG モードでのプロジェクト JSON 保存 / 復元導線

### 5. 保存形式を v2 に切り替える場合は legacy importer を用意する

現時点では legacy JSON を実運用で使っているため、破壊的に v2 へ切り替えるなら one-shot importer を別導線で用意する方が安全です。
