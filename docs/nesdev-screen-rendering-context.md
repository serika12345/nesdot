# NES 画面描画コンテキスト（2026-04 時点）

## 目的

この文書は、`nesdot` の画面描画まわりで「NES らしさ」をどこまで実装済みか、どこから先が未対応かを整理するための実装メモです。

完全なエミュレータ再現ではなく、現在のプレビュー、BG 編集、画面配置で実際に効いている制約だけを対象にします。

## 実装の現在地

- 画面プレビューは [../src/presentation/components/common/ui/canvas/ScreenCanvas.tsx](../src/presentation/components/common/ui/canvas/ScreenCanvas.tsx) から [../src/infrastructure/browser/canvas/useScreenCanvas.ts](../src/infrastructure/browser/canvas/useScreenCanvas.ts) を経由し、最終的に [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `renderScreenToHexArray` で描画しています。
- PNG/SVG エクスポートも [../src/application/state/projectStore.ts](../src/application/state/projectStore.ts) の `getHexArrayForScreen` から同じ合成ロジックを使います。
- 実アプリの正本はまだ legacy の [../src/domain/project/project.ts](../src/domain/project/project.ts) の `ProjectState` です。`screen` は `sprites` だけを持ち、背景は `nes.chrBytes` / `nes.nameTable` / `nes.attributeTable` に残っています。
- BG 編集モードは [../src/presentation/components/bgMode/logic/bgModeWorkspaceEditingState.ts](../src/presentation/components/bgMode/logic/bgModeWorkspaceEditingState.ts) の `useBgModeTileEditorState` で `nes.chrBytes` を直接編集します。
- 画面配置モードの BG タイル配置 / BG 属性編集は [../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts](../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts) の `useScreenModeWorkspaceBackgroundEditingState` で `nes.nameTable` と `nes.attributeTable` を直接更新します。
- スプライト制約チェックは [../src/domain/screen/oamSync.ts](../src/domain/screen/oamSync.ts) の `mergeScreenIntoNesOam` で `screen.sprites` を OAM に写し、[../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts) の `scanNesSpriteConstraints` で判定します。
- 並行して、正規化済みの [../src/domain/project/projectV2.ts](../src/domain/project/projectV2.ts) / [../src/domain/project/projectV2Schema.ts](../src/domain/project/projectV2Schema.ts) / [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts) も整備されています。ただしこれは主に domain / test 用で、Zustand ストアや import/export の正本にはまだ接続されていません。

## 実装済みの NES 寄り制約

### 1. 背景は `32x30` の nametable と `16x16` の attribute 領域で扱う

背景描画は `nes.nameTable.tileIndices` と `nes.attributeTable.bytes` を前提にしており、`8x8` タイル配置と `16x16` 単位の背景パレット解決が入っています。

- タイル座標の一次元化は [../src/domain/nes/nesProject.ts](../src/domain/nes/nesProject.ts) の `getNameTableLinearIndex`
- 属性バイト解決は [../src/domain/nes/nesProject.ts](../src/domain/nes/nesProject.ts) の `getAttributeByteIndex` / `resolveBackgroundPaletteIndex`
- 画面配置モードの BG タイル更新は [../src/domain/nes/backgroundEditing.ts](../src/domain/nes/backgroundEditing.ts) の `setNameTableTileAtPixel`
- 画面配置モードの BG 属性更新は [../src/domain/nes/backgroundEditing.ts](../src/domain/nes/backgroundEditing.ts) の `setAttributeTablePaletteAtPixel`

未配置セルは [../src/domain/nes/nesProject.ts](../src/domain/nes/nesProject.ts) の `NES_EMPTY_BACKGROUND_TILE_INDEX = -1` で表現しています。

### 2. `palette entry 0` は backdrop / 透明として扱う

背景・スプライトとも、透明判定は最終色ではなく color index `0` 基準で処理しています。

- 背景側は [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `resolveBackgroundPixelAt` が `colorIndex === 0` を backdrop 扱いにし、`universalBackgroundColor` を返します
- スプライト側は [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `resolveSpriteColorIndexAt` が color index `0` を描画対象から外します
- `NES_EMPTY_BACKGROUND_TILE_INDEX` のセルは「未配置の透明背景」として扱われます

### 3. スプライトの前後関係は `screen.sprites` 配列順と priority で決める

現在の実装では `screen.sprites` の配列順を OAM 順相当として扱っています。

- [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `resolveSpritePixelAt` は `screen.sprites.find(...)` で最初の非透明ピクセルを採用します
- `priority === "behindBg"` のときだけ、背景ピクセルが不透明なら背景を優先します
- `flipH` / `flipV` は [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `resolveSpriteColorIndexAt` で反映済みです

### 4. スプライト座標は OAM 同期時に `Y-1` を反映し、制約チェックは NES 基準で行う

- [../src/domain/screen/oamSync.ts](../src/domain/screen/oamSync.ts) の `toOamEntryFromScreenSprite` が `screen` 座標を OAM へ変換し、`y - 1` と priority / flip bit を attribute byte に詰めます
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts) は `64` 枚上限、1 scanline `8` 枚上限、`ppuControl.spriteSize` を使った scanline 判定を実装済みです
- screen mode では [../src/presentation/components/screenMode/logic/useScreenModeProjectState.ts](../src/presentation/components/screenMode/logic/useScreenModeProjectState.ts) からこの検査結果を UI に出しています

### 5. BG 編集と画面配置 BG 編集は実装済み

設計段階では後回しだった BG 編集経路は、現在は最低限の実装が入っています。

- BG 編集モード: `nes.chrBytes` の 256 タイルを直接編集
- 画面配置モード: `nes.nameTable` へ BG タイル配置、`nes.attributeTable` へ BG 属性ペイント
- どちらも E2E で回帰確認されています

## 並行して整備済みの v2 ドメイン

アプリ本体はまだ legacy `ProjectState` ですが、正規化済み v2 に向けた pure function 群はすでにあります。

- [../src/domain/project/projectV2.ts](../src/domain/project/projectV2.ts): `backgroundTiles` / `screen.background` を持つ正規化 state
- [../src/domain/project/projectV2Schema.ts](../src/domain/project/projectV2Schema.ts): v2 JSON schema
- [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts): v2 state から `chrBytes` / `nameTable` / `attributeTable` / `oam` を導出
- [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts): `renderProjectStateV2ToHexArray`
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts): `scanProjectStateV2SpriteConstraints`

この層は設計検証と test では使われていますが、現時点では UI ストアや import/export の正本ではありません。

## 未実装・未反映の点

### 1. 左端 8px マスク

`PPUMASK` 相当の「左端 8px だけ BG / sprite を隠す」挙動は未実装です。renderer に BG / sprite 個別 mask はまだありません。

### 2. `8x16` スプライトの実機寄りタイル解決

現在の `SpriteTile` は `8x16` をそのまま縦 16 ピクセルの配列として持ちます。実機のような「tile 番号 bit 0 で pattern table を選び、上下 2 タイルを結合する」解決はしていません。

### 3. pattern table bank の実効利用

`ppuControl.backgroundPatternTable` / `spritePatternTable` は state にはありますが、実アプリの `nes.chrBytes` は 4096 byte の単一配列で、renderer も bank 切り替えをまだ使っていません。

### 4. 背景の正本移行

正規化済み `screen.background` / `backgroundTiles` は domain 側に存在しますが、アプリの store・保存形式・import/export はまだ legacy です。

### 5. 実機タイミング依存の PPU 挙動

以下は引き続き対象外です。

- sprite overflow flag のバグ再現
- sprite 0 hit
- scanline / dot 単位のフェッチ順序
- vblank 中だけ VRAM / OAM 書き換え可能という制約
- odd frame の 1 dot short
- forced blank 中の backdrop override

## 次に見るべきファイル

- [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts)
- [../src/domain/nes/backgroundEditing.ts](../src/domain/nes/backgroundEditing.ts)
- [../src/domain/screen/oamSync.ts](../src/domain/screen/oamSync.ts)
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts)
- [../src/presentation/components/bgMode/logic/bgModeWorkspaceEditingState.ts](../src/presentation/components/bgMode/logic/bgModeWorkspaceEditingState.ts)
- [../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts](../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts)
- [../src/domain/project/projectV2.ts](../src/domain/project/projectV2.ts)
- [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts)

## 参照元

- NESdev Wiki: PPU nametables
  <https://www.nesdev.org/wiki/PPU_nametables>
- NESdev Wiki: PPU attribute tables
  <https://www.nesdev.org/wiki/PPU_attribute_tables>
- NESdev Wiki: PPU palettes
  <https://www.nesdev.org/wiki/PPU_palettes>
- NESdev Wiki: PPU OAM
  <https://www.nesdev.org/wiki/PPU_OAM>
- NESdev Wiki: PPU sprite evaluation
  <https://www.nesdev.org/wiki/PPU_sprite_evaluation>
- NESdev Wiki: PPU sprite priority
  <https://www.nesdev.org/wiki/PPU_sprite_priority>
- NESdev Wiki: PPU registers
  <https://www.nesdev.org/wiki/PPU_registers>
- NESdev Wiki: PPU rendering
  <https://www.nesdev.org/wiki/PPU_rendering>
