# NES 画面描画コンテキスト（nesdev ベース）

## 目的

この文書は、`nesdev` に書かれている PPU 仕様のうち、`nesdot` の「画面描画プレビュー」に直接効く制約だけを抜き出し、実装順とデータ設計の判断材料として使うためのものです。

ここでは「エミュレータの完全再現」ではなく、「NES らしい見え方を崩さないために、画面描画で最低限入れるべき制約」を優先します。

## このリポジトリの現状

- `screen` は `256x240` 固定で、`backgroundTiles` と `sprites` を持っています。
- 背景タイルのデータ構造はありますが、[`useScreenCanvas.ts`](/Users/masato/Documents/nesdot/src/components/hooks/useScreenCanvas.ts#L28) は背景を描かず、チェッカ背景の上にスプライトだけを描いています。
- [`getHexArrayForScreen`](/Users/masato/Documents/nesdot/src/store/projectState.ts#L148) は背景とスプライトの合成をしていますが、背景パレットを `8x8` 単位で持っており、NES の `16x16` 属性領域を表現できません。
- スプライトの前後関係は [`spriteIndex` 昇順で描画](/Users/masato/Documents/nesdot/src/store/projectState.ts#L181) しており、NES の OAM 順序とは一致していません。
- [`ScreenMode.tsx`](/Users/masato/Documents/nesdot/src/components/ScreenMode.tsx#L24) の制約チェックは、総数 `64` とスキャンライン `8` 枚までに限定されています。

## 実装するべき制約

### 1. 背景は `32x30` の nametable と `16x16` の attribute 領域で扱う

`nesdev` では、1 画面は `32x30` タイル、各タイルは `8x8` ピクセル、合計 `256x240` ピクセルです。背景パレットの割り当てはタイルごとではなく、通常は `16x16` ピクセル単位です。

- 1 nametable は `32x30` タイルで `256x240`
- attribute table は各 `16x16` 領域に対して 2-bit のパレット番号を持つ
- つまり背景は「タイル番号」と「パレット属性」を分離して持つ必要があります

このため、現在の `BackgroundTile.paletteIndex` を `8x8` ごとに持つ構造は NES より自由すぎます。背景編集を入れるなら、少なくとも次のどちらかに寄せるべきです。

- `32x30` のタイル番号配列 + `16x15` の背景パレット属性配列
- 内部表現は現状維持でも、描画時と保存時に `16x16` 制約を検証する

### 2. パレットの `slot0` は「普通の色」ではなく backdrop / 透明として扱い分ける

`nesdev` では、背景・スプライトともに 4 パレット x 4 色ですが、各パレットの entry 0 は特別です。

- 背景側では palette 0 の entry 0 が universal background color / backdrop color
- 背景・スプライトともに各 palette の entry 0 は「色番号 0」で、透明判定に使われる
- スプライトの色番号 0 は常に透明で、実色としては描かれない

したがって描画合成は `hex が何色か` ではなく、`pattern の color index が 0 かどうか` で透明判定する必要があります。現在の [`getHexArrayForScreen`](/Users/masato/Documents/nesdot/src/store/projectState.ts#L205) は `NES_PALETTE_HEX[0]` と比較しており、palette slot 0 を差し替えた場合の意味論とズレます。

### 3. スプライトの優先順位は「配置順」ではなく OAM 順序と priority bit で決まる

`nesdev` のルールでは、スプライト同士の優先順位は OAM の若い番号が前です。そのうえで各スプライトは「背景の前 / 後ろ」の 1-bit priority を持ちます。

- lower OAM index のスプライトが前
- 背景との合成は「sprite pixel が非透明か」「background pixel が非透明か」「sprite priority bit」で決まる
- back-priority の低 OAM スプライトが、後ろにあるはずの front-priority スプライトを隠すことがある

このため、画面上のスプライトには少なくとも次が必要です。

- `oamIndex` または `screen.sprites` 配列順を OAM 順として固定するルール
- `priority: "front" | "behindBg"`
- 可能なら `flipH` / `flipV`

現在の [`spriteIndex` 昇順描画](/Users/masato/Documents/nesdot/src/store/projectState.ts#L181) は「どの CHR タイルを使っているか」を前後関係に流用しており、NES の見え方とは一致しません。

### 4. スプライト座標は NES の OAM 制約を意識して扱う

`nesdev` 上の OAM 仕様で重要なのは次です。

- 総数は `64`
- 1 スキャンラインに描画対象として拾われるのは先頭 `8` 枚まで
- Y は 1 ライン遅延した形で OAM に入る
- スプライトは画面上端に一部だけ出すことができない
- 右端はクリップできるが、左端に部分表示することはできない
- 左端の見切れ表現は PPUMASK の left clipping で代用する

このアプリの UI では「生 OAM 値」を直接見せるより、「見た目上の座標」で編集し、必要ならエクスポート時に OAM 値へ変換する方が扱いやすいです。ただし内部仕様としては次を決めておくべきです。

- `x < 0` を許すのか、それとも NES 的に禁止するのか
- `y < 0` を許すのか、それとも「上にははみ出せない」として禁止するのか
- 画面プレビューは「実機寄り」か「作画補助寄り」か

もし `nesdot` を制約確認ツールとして使うなら、既定値は「NES 実機寄り」に寄せるのが自然です。

### 5. `8x16` スプライトは単純な `8x16` ビットマップではなく、2 タイル結合として扱う

`nesdev` では `8x16` スプライトに次の制約があります。

- pattern table の選択は PPUCTRL ではなく tile 番号 bit 0 で決まる
- tile 番号は上半分のタイルを指し、下半分は次のタイル
- vertical flip 時は上下のサブタイルも入れ替わる

今の `SpriteTile` は `8x16` を 1 枚の連続ピクセルとして持っていますが、実機に寄せるなら「2 枚の 8x8 タイル結合」として扱う文脈を残した方が、CHR 出力や将来の OAM 出力と整合します。

### 6. 左端 8 ピクセルの BG / sprite マスクは別々に持つ

`PPUMASK` には「左端 8 ピクセルだけ背景を隠す」「左端 8 ピクセルだけスプライトを隠す」の制御があります。これは単なる表示オプションではなく、NES 的な見切れやスクロール継ぎ目の見え方に効きます。

このアプリに入れると価値があるのは次です。

- 背景 left mask の ON/OFF
- sprite left mask の ON/OFF
- マスク適用後の見え方を画面プレビューに反映

負の X を許す設計にしないなら、sprite left mask は「左端から出入りする見た目」を確認するためにも必要です。

## 今は後回しでよいもの

以下は `nesdev` 的には重要ですが、このアプリの「制約つき作画プレビュー」には直結しません。

- sprite overflow flag のバグ再現
- sprite 0 hit
- scanline / dot 単位の正確なフェッチ順序
- vblank 中しか VRAM/OAM を触れない制約
- odd frame の 1 dot short
- forced blank 中の backdrop override

これらはエミュレータや実機互換レンダラには必要ですが、`nesdot` の画面プレビューでは優先度を落としてよいです。

## このリポジトリでの実装順

1. 背景描画を `checker` から `backgroundTiles` ベースへ置き換える
2. 背景パレット制約を `8x8` 単位から `16x16` 単位へ落とし込む
3. スプライトに `oamIndex` / `priority` / `flipH` / `flipV` を追加する
4. 画面合成を「backdrop -> background -> sprite」の NES ルールへ更新する
5. 左端 8px マスクを追加する
6. 必要なら scroll / mirroring を別フェーズで導入する

## データモデルの提案

実装を進めるなら、`Screen` は次のように分けると扱いやすいです。

```ts
type Screen = {
  width: 256;
  height: 240;
  backdropColor: NesColorIndex;
  backgroundTileIndices: number[][];
  backgroundTilePalette: PaletteIndex[][];
  sprites: Array<{
    spriteIndex: number;
    x: number;
    y: number;
    paletteIndex: PaletteIndex;
    priority: "front" | "behindBg";
    flipH: boolean;
    flipV: boolean;
    oamIndex: number;
  }>;
  maskLeft8Background: boolean;
  maskLeft8Sprites: boolean;
};
```

補足:

- `backgroundTileIndices` は `30x32`
- `backgroundTilePalette` は `15x16` が NES に自然
- `sprites` の並びを OAM 順とみなすなら `oamIndex` は省略可能
- `backdropColor` は `palettes[0][0]` と同期させてもよい

## 実装完了の判定基準

少なくとも以下が満たせれば、「NES 画面描画の制約を意識したプレビュー」と言えます。

- 背景が `32x30` の `8x8` タイルとして描かれる
- 背景パレットが `16x16` 単位でしか変えられない
- スプライトは `64` 枚 / 1 scanline `8` 枚制約でチェックできる
- スプライト同士の前後関係が OAM 順で決まる
- sprite priority bit によって背景の前後が変わる
- sprite color index `0` が透明として正しく処理される
- 左端 8px mask の ON/OFF が見え方に反映される

## 参照元

- NESdev Wiki: PPU nametables  
  https://www.nesdev.org/wiki/PPU_nametables
- NESdev Wiki: PPU attribute tables  
  https://www.nesdev.org/wiki/PPU_attribute_tables
- NESdev Wiki: PPU palettes  
  https://www.nesdev.org/wiki/PPU_palettes
- NESdev Wiki: PPU OAM  
  https://www.nesdev.org/wiki/PPU_OAM
- NESdev Wiki: PPU sprite evaluation  
  https://www.nesdev.org/wiki/PPU_sprite_evaluation
- NESdev Wiki: PPU sprite priority  
  https://www.nesdev.org/wiki/PPU_sprite_priority
- NESdev Wiki: PPU registers  
  https://www.nesdev.org/wiki/PPU_registers
- NESdev Wiki: PPU rendering  
  https://www.nesdev.org/wiki/PPU_rendering
