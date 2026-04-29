# NES 画面描画コンテキスト（2026-04 時点）

## 目的

この文書は、`nesdot` の画面描画まわりで「NES らしさ」をどこまで実装済みか、どこから先が未対応かを整理するための実装メモです。

完全なエミュレータ再現ではなく、現在のプレビュー、BG 編集、画面配置で実際に効いている制約だけを対象にします。

## 実装の現在地

- プロジェクト状態の正本は [../src/domain/project/projectV2.ts](../src/domain/project/projectV2.ts) の `ProjectStateV2` です。
- Zustand store は [../src/application/state/projectStore.ts](../src/application/state/projectStore.ts) で `ProjectStateV2` を保持します。
- スプライトタイルは `spriteTiles`、BG タイルは `backgroundTiles`、画面上の背景配置と属性は `screen.background` にあります。
- NES raw state は保存せず、[../src/domain/nes/projection.ts](../src/domain/nes/projection.ts) が `chrBytes` / `nameTable` / `attributeTable` / `oam` を導出します。
- 画面プレビューは [../src/presentation/components/common/ui/canvas/ScreenCanvas.tsx](../src/presentation/components/common/ui/canvas/ScreenCanvas.tsx) から [../src/infrastructure/browser/canvas/useScreenCanvas.ts](../src/infrastructure/browser/canvas/useScreenCanvas.ts) を経由し、[../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts) の `renderProjectStateV2ToHexArray` で描画しています。
- PNG/SVG エクスポートも [../src/application/state/projectStore.ts](../src/application/state/projectStore.ts) の `getHexArrayForScreen` から同じ合成ロジックを使います。
- スプライト制約チェックは [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts) の `scanProjectStateV2SpriteConstraints` で、v2 state から導出した OAM 相当の情報を使って判定します。

## 実装済みの NES 寄り制約

### 1. 背景は `32x30` の nametable と `16x16` の attribute 領域で扱う

v2 state では、背景配置は `screen.background.tileIndices`、背景 palette 領域は `screen.background.paletteIndices` で保持します。NES raw state が必要なときだけ projection で `nameTable` と `attributeTable` を組み立てます。

- タイル座標の一次元化は [../src/domain/screen/backgroundLayout.ts](../src/domain/screen/backgroundLayout.ts)
- 背景 palette 領域の一次元化と pixel からの解決は [../src/domain/screen/backgroundPalette.ts](../src/domain/screen/backgroundPalette.ts)
- NES attribute byte への変換は [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts)

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

### 4. スプライト座標は OAM 変換時に `Y-1` を反映し、制約チェックは NES 基準で行う

- [../src/domain/screen/oamSync.ts](../src/domain/screen/oamSync.ts) の `toOamEntryFromScreenSprite` が `screen` 座標を OAM へ変換し、`y - 1` と priority / flip bit を attribute byte に詰めます
- [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts) が `screen.sprites` から OAM projection を導出します
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts) は `64` 枚上限、1 scanline `8` 枚上限、`spriteSize` を使った scanline 判定を実装済みです
- screen mode では [../src/presentation/components/screenMode/logic/useScreenModeProjectState.ts](../src/presentation/components/screenMode/logic/useScreenModeProjectState.ts) からこの検査結果を UI に出しています

### 5. BG 編集と画面配置 BG 編集は v2 state に接続済み

- BG 編集モード: `backgroundTiles` の 256 タイルを直接編集
- 画面配置モード: `screen.background.tileIndices` へ BG タイル配置、`screen.background.paletteIndices` へ BG 属性ペイント
- どちらも E2E で回帰確認されています

## 保存形式

プロジェクト JSON は [../src/domain/project/projectV2Schema.ts](../src/domain/project/projectV2Schema.ts) の `formatVersion: 2` だけを受け付けます。

- `spriteTiles` と `backgroundTiles` は編集可能な tile library です
- `screen.background` と `screen.sprites` は画面配置です
- `palettes` と `ppuControl` は NES projection に必要な設定です
- 旧 `sprites` / `nes` 形状の JSON 互換はありません

## 未実装・未反映の点

### 1. 左端 8px マスク

`PPUMASK` 相当の「左端 8px だけ BG / sprite を隠す」挙動は未実装です。renderer に BG / sprite 個別 mask はまだありません。

### 2. `8x16` スプライトの実機寄りタイル解決

現在の `SpriteTile` は `8x16` をそのまま縦 16 ピクセルの配列として持ちます。実機のような「tile 番号 bit 0 で pattern table を選び、上下 2 タイルを結合する」解決はしていません。

### 3. pattern table bank の実効利用

`ppuControl.backgroundPatternTable` / `spritePatternTable` は v2 state にありますが、renderer は bank 切り替えをまだ使っていません。現在の CHR projection は `backgroundTiles` から単一の 4096 byte 相当を組み立てます。

### 4. 実機タイミング依存の PPU 挙動

以下は引き続き対象外です。

- sprite overflow flag のバグ再現
- sprite 0 hit
- scanline / dot 単位のフェッチ順序
- vblank 中だけ VRAM / OAM 書き換え可能という制約
- odd frame の 1 dot short
- forced blank 中の backdrop override

## 次に見るべきファイル

- [../src/application/state/projectStore.ts](../src/application/state/projectStore.ts)
- [../src/domain/project/projectV2.ts](../src/domain/project/projectV2.ts)
- [../src/domain/project/projectV2Schema.ts](../src/domain/project/projectV2Schema.ts)
- [../src/domain/nes/projection.ts](../src/domain/nes/projection.ts)
- [../src/domain/nes/rendering.ts](../src/domain/nes/rendering.ts)
- [../src/domain/screen/backgroundLayout.ts](../src/domain/screen/backgroundLayout.ts)
- [../src/domain/screen/backgroundPalette.ts](../src/domain/screen/backgroundPalette.ts)
- [../src/domain/screen/constraints.ts](../src/domain/screen/constraints.ts)
- [../src/presentation/components/bgMode/logic/bgModeWorkspaceEditingState.ts](../src/presentation/components/bgMode/logic/bgModeWorkspaceEditingState.ts)
- [../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts](../src/presentation/components/screenMode/logic/screenModeWorkspaceBackgroundEditingState.ts)

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
