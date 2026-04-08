# BG編集モードと画面配置BG配置の設計

## 目的

BG編集モードを追加し、背景タイルそのものを編集できるようにします。
あわせて画面配置モードでも BG タイルを配置し、背景配置と背景属性を UI から編集できるようにします。

この設計は、既存の NES 仕様メモである `docs/nesdev-screen-rendering-context.md` を前提に、現行実装へ最小限の破壊で機能を足すためのものです。

## 現状整理

### 既存のデータ責務

- スプライト編集は `ProjectState.sprites` を編集対象にしている
- 画面配置は `ProjectState.screen.sprites` を編集対象にしている
- 背景描画は `ProjectState.nes.nameTable` / `ProjectState.nes.attributeTable` / `ProjectState.nes.chrBytes` を直接参照している
- つまり BG はすでにレンダリング対象だが、UI から編集する経路だけが無い

### 現状の制約

- `screen` はスプライト専用で、背景用の別レイヤーデータは持っていない
- `nes.chrBytes` は 4096 byte で保持されており、BG の絵柄ソースは `sprites` とは別管理になっている
- 画面配置の操作系は `useScreenModeGestureState` に強く集約されており、ほぼ全てが sprite 前提で組まれている
- import/export は `nameTable` / `attributeTable` / `chrBytes` をすでに JSON 保存対象としている
- macOS のネイティブメニューと `WorkMode` は `sprite` / `character` / `screen` の 3 モードだけを持つ

### 背景機能で崩したくない点

- 背景は NES どおり `32x30` の 8x8 タイル単位で扱う
- 背景パレット属性は `16x16` 単位で扱う
- スプライト制約チェックの挙動は維持する
- 画面プレビューの最終的な見え方は既存 renderer の意図から大きく外さない

### JSON 互換の扱い

- 旧 JSON 互換は前提にしない
- BG 機能の追加を機に、編集向けの正規化データ構造へ移行する
- 旧 JSON が必要になった場合だけ、別途 one-shot importer を用意する

## 要件の解釈

今回の要件は次の 2 つに分けて扱うのが自然です。

1. 新しいトップレベル作業モードとして BG編集モードを追加する
2. 画面配置モードでも BG タイルと BG 属性を編集できるようにする

この 2 つは役割を分けます。

- BG編集モード: BG タイルの絵柄を作る場所
- 画面配置モード: BG タイルを画面へ配置し、属性パレットを塗る場所

## 設計方針

### 方針 1: JSON を壊して編集向けの ProjectState を正本にする

既存 `ProjectState` は次の重複を含んでいます。

- スプライト絵柄: `sprites`
- 画面上スプライト配置: `screen.sprites`
- NES 向け投影: `nes.chrBytes` / `nes.nameTable` / `nes.attributeTable` / `nes.oam`

BG を足すと、この重複がさらに増えます。
JSON 互換を捨てられるなら、ここを根本的に正し、編集向けの正規化モデルを正本にします。

推奨する `ProjectState` の形は次です。

```ts
type BgTile = {
  width: 8;
  height: 8;
  pixels: ReadonlyArray<ReadonlyArray<0 | 1 | 2 | 3>>;
};

type ScreenBackground = {
  widthTiles: 32;
  heightTiles: 30;
  tileIndices: ReadonlyArray<number>;
  paletteIndices: ReadonlyArray<0 | 1 | 2 | 3>;
};

type ProjectState = {
  formatVersion: 2;
  spriteSize: 8 | 16;
  spriteTiles: ReadonlyArray<SpriteTile>;
  backgroundTiles: ReadonlyArray<BgTile>;
  screen: {
    width: 256;
    height: 240;
    background: ScreenBackground;
    sprites: ReadonlyArray<SpriteInScreen>;
  };
  palettes: {
    universalBackgroundColor: NesColorIndex;
    background: NesBackgroundPalettes;
    sprite: NesSpritePalettes;
  };
  ppuControl: {
    backgroundPatternTable: 0 | 1;
    spritePatternTable: 0 | 1;
  };
};
```

補足:

- `spriteTiles` は現行 `sprites` の役割を引き継ぐ
- `backgroundTiles` は BG編集モードの直接編集対象
- `screen.background.tileIndices` は 960 要素の `32x30`
- `screen.background.paletteIndices` は 240 要素の `16x15`
- `nes` の raw 構造は保存データから外し、必要時に導出する

### 方針 2: NES 形式は保存しないで導出する

`nameTable` / `attributeTable` / `chrBytes` / `oam` は編集時の source of truth ではなく、描画やエクスポートのための投影値に下げます。

理由:

- raw byte を直接編集対象にすると UI が不自然になる
- `screen.sprites` と `nes.oam` のような二重管理を減らせる
- BG 機能追加後も state の責務が明確になる

### 方針 3: 画面配置の BG 編集は `screen.background` を直接編集する

BG を sprite のような自由配置オブジェクトにすると NES 制約を壊します。
そのため画面配置モードでは次の編集対象切り替えを導入し、編集先は `screen.background` に固定します。

- `sprite`: `screen.sprites`
- `bg-tile`: `screen.background.tileIndices`
- `bg-palette`: `screen.background.paletteIndices`

### 方針 4: 既存の sprite ジェスチャー実装は分離して守る

現行の `useScreenModeGestureState` は sprite 前提の責務が大きいです。
BG 編集を同じ状態機械へ無理に混ぜると回帰しやすいため、screenMode 側は編集対象ごとに hook を分けます。

### 方針 5: renderer は正規化 state か派生 projection を読む

次のいずれかに寄せます。

- renderer が `ProjectState` を直接読む
- `ProjectState` から `NesRenderProjection` を組み立て、その projection を renderer が読む

どちらでもよいですが、保存データに `nes` raw 値を持ち続ける設計は採用しません。

## ユーザー向け仕様

## 1. BG編集モード

### 1.1 モード追加

- 新しい `WorkMode` として `bg` を追加する
- UI 表示名は `BG編集`
- Web メニュー、macOS ネイティブメニュー、Tauri メニューイベントをすべて追加する

### 1.2 編集対象

- 編集対象は `ProjectState.backgroundTiles` の 8x8 BG タイル
- 1 タイルは常に 8x8
- スプライトのような `8x16` は持たない
- 編集可能なタイル数は 256 枚とする

### 1.3 BG編集モードでできること

- BG タイル一覧から編集対象を選ぶ
- ペンでピクセル値 1..3 を打つ
- 消しゴムでピクセル値 0 を打つ
- 既存パレットを使ってプレビュー表示する
- プロジェクト保存/復元経由で編集結果を保持する

ここでいう BG編集モードは、あくまで BG タイルの絵柄編集だけを行う画面です。
画面配置モードで使う `BGタイル追加` ボタン、選択ダイアログ、掴み状態、ステージクリックによる配置確定は、このモードには持ち込みません。

### 1.4 BG編集モードでやらないこと

- タイル並べ替え
- タイル削除という概念の導入
- 別ファイル形式の BG 専用保存
- `BGタイル追加` ボタンによる配置フロー
- 掴み状態でステージへ置く配置フロー
- スクロール、ミラーリング、複数 nametable 編集

タイル並べ替えを入れない理由は、`screen.background.tileIndices` が直接 index を参照しており、並べ替えが既存画面を広範囲に壊すためです。

### 1.5 クリア仕様

- タイル内の消去は「そのピクセルを 0 に戻す」
- 画面配置での消去専用ツールは v1 では持たない
- 背景セルを初期値へ戻したい場合は tile index `0` を明示選択して塗る

`tile 0` を空タイルとして予約固定はしません。
初期状態では空ですが、編集後に空でなくなることは許容します。

## 2. 画面配置モードの BG 編集

### 2.1 編集対象切り替え

画面配置モード上部に編集対象トグルを追加します。

- `スプライト`
- `BGタイル`
- `BG属性`

各モードの意味:

- `スプライト`: 現行どおり、選択・複数選択・ドラッグ移動・右クリックメニューが使える
- `BGタイル`: 8x8 グリッドへタイル index を塗る
- `BG属性`: 16x16 領域へ背景パレット番号を塗る

### 2.2 BGタイル配置

- `BGタイル` 編集時に `BGタイル追加` ボタンを表示する
- ボタンを押すと、表示領域の大きい BG タイル選択ダイアログを開く
- ダイアログ上にはプレビュー付きで BG タイル一覧を表示する
- プレビューをクリックすると、そのタイルを「掴んだ」状態にする
- 掴んだ状態でステージをクリックすると、その位置に BG タイル配置を確定する
- 配置先は `screen.background.tileIndices`
- 配置可能位置は常に `8x8` グリッド単位とし、自由座標には置けない
- ポインター位置は必ず `(floor(x / 8) * 8, floor(y / 8) * 8)` にスナップして解決する
- ステージ外や無効位置では配置を確定しない
- v1 では 1 回の配置が確定したら掴み状態を解除する

つまり BG タイルは「ドラッグして塗る」のではなく、「選ぶ -> 掴む -> 置く」の 3 段階で扱います。

### 2.3 BG属性配置

- ステージ上のクリックで 1 属性領域を塗る
- ドラッグ中は通過した属性領域へ連続で塗る
- 塗る対象は `screen.background.paletteIndices`
- スナップ単位は常に `16x16`、つまり 2x2 タイル単位
- 選択中パレット番号は 0..3 の 4 つから選ぶ

### 2.4 BG 編集時の右クリック

sprite layer の右クリックは現行どおりコンテキストメニューを出します。

BG 系レイヤーでは右クリックの意味を変更します。

- `BGタイル`: クリック位置のタイル index をスポイト取得する
- `BG属性`: クリック位置の属性パレット番号をスポイト取得する

理由:

- BG 編集では sprite 用コンテキストメニューが不要
- 右クリックスポイトの方が反復配置に向く

### 2.5 サイドバー構成

現行の screenMode サイドバーは維持しますが、BG タイル選択は常設サイドバーではなく専用ダイアログで行います。

- スプライトプレビュー
- キャラクタープレビュー

### 2.5.1 画面配置モード専用 BGタイル追加ダイアログ

- `BGタイル` 編集中だけ `BGタイル追加` ボタンを表示する
- ボタン押下で大きいダイアログを開く
- ダイアログ内で 256 枚の BG タイルをプレビュー付きグリッドで表示する
- プレビュークリックで選択完了とし、掴み状態へ遷移する
- 掴み状態に入ったらダイアログは閉じる
- 掴み状態の解除方法は、ステージへの配置確定を基本とする

ダイアログ内プレビューの仕様:

- 256 枚をスクロール表示する
- クリック選択中心とする
- 選択中タイルは明確にハイライトする
- プレビュー色は選択中背景パレット番号で描く

### 2.6 ステージ上のオーバーレイ

- `スプライト` 編集時: 現行の外枠、選択、マルキーを維持する
- `BGタイル` 編集時: 8x8 カーソルセルを強調し、掴み中タイルのスナップ済みプレビューを表示する
- `BG属性` 編集時: 16x16 カーソル領域を強調する

スプライト外枠表示や `#表示` は sprite layer のときだけ有効にします。

## 3. パレット仕様

### 3.1 共通パレットエディタとの関係

既存の `PalettePicker` は現在、背景パレット変更を sprite パレットにも反映する実装です。
今回の機能ではこの挙動は変更しません。

つまり v1 では次を維持します。

- 色そのものの編集: 既存 `PalettePicker`
- BG タイル描画や BG プレビューに使う「どの背景パレットで見るか」の選択: BG モード / screenMode 側のローカル state

### 3.2 新しく必要なローカル state

- BG編集モードの `activeBackgroundPaletteIndex`
- 画面配置モード BG属性編集用の `activeAttributePaletteIndex`
- 画面配置モード BGタイル用の `isBackgroundTilePickerOpen`
- 画面配置モード BGタイル用の `grabbedBackgroundTileIndex: Option<number>`
- 画面配置モード BGタイル用の `grabbedBackgroundTilePreviewPosition`

この値は UI の選択状態であり、プロジェクト JSON へは保存しません。

## ドメイン設計

## 1. source of truth を整理する

BG 追加後の正本は次の 3 系統に分けます。

- タイル絵柄: `spriteTiles` / `backgroundTiles`
- 画面配置: `screen.sprites` / `screen.background`
- 色設定: `palettes`

この形なら、現在のように「編集用 state と NES raw state を両方持つ」必要がありません。

## 2. 追加する純粋関数

### 2.1 BG tile <-> CHR 変換

新規候補ファイル:

- `src/domain/nes/chr.ts`

追加候補関数:

```ts
encodeBackgroundTile(tile: BgTile): ReadonlyArray<number>
decodeBackgroundTile(bytes: ReadonlyArray<number>): BgTile
encodeBackgroundTilesToChrBytes(
  tiles: ReadonlyArray<BgTile>,
): ReadonlyArray<number>
```

役割:

- `backgroundTiles` を NES CHR byte 列へ変換する
- 必要なら legacy import 時だけ byte 列から `BgTile` へ戻す

### 2.2 screen.background のタイル編集

新規候補ファイル:

- `src/domain/screen/backgroundLayout.ts`

追加候補関数:

```ts
setScreenBackgroundTile(
  background: ScreenBackground,
  tileX: number,
  tileY: number,
  nextTileIndex: number,
): Either<string, ScreenBackground>

paintScreenBackgroundTiles(
  background: ScreenBackground,
  cells: ReadonlyArray<{ tileX: number; tileY: number }>,
  nextTileIndex: number,
): Either<string, ScreenBackground>
```

必要なら drag 用に複数点をまとめて適用する関数も追加します。

### 2.3 screen.background の属性編集

新規候補ファイル:

- `src/domain/screen/backgroundPalette.ts`

追加候補関数:

```ts
setScreenBackgroundPalette(
  background: ScreenBackground,
  regionX: number,
  regionY: number,
  paletteIndex: 0 | 1 | 2 | 3,
): Either<string, ScreenBackground>
```

ここでの `regionX` / `regionY` は `16x16` 領域、つまり `16x15` グリッドを指します。

### 2.4 正規化 state から NES projection を作る

新規候補ファイル:

- `src/domain/nes/projection.ts`

追加候補関数:

```ts
buildNameTable(background: ScreenBackground): NesNameTable
buildAttributeTable(background: ScreenBackground): NesAttributeTable
buildOamFromScreenSprites(
  sprites: ReadonlyArray<SpriteInScreen>,
): ReadonlyArray<OamSpriteEntry>
buildNesProjection(projectState: ProjectState): NesProjectState
```

役割:

- `screen.background.tileIndices` から `nameTable` を導出する
- `screen.background.paletteIndices` から `attributeTable.bytes` を導出する
- `screen.sprites` から `oam` を導出する
- renderer / export / 制約チェック用に `NesProjectState` を組み立てる

## 3. store 更新責務

`setScreenAndSyncNes` のような「screen を更新しつつ nes も同期する」責務はやめます。
正規化モデルへ寄せるなら、更新対象ごとに setter を分ける方が安全です。

候補:

```ts
setSpriteTiles(nextSpriteTiles: ReadonlyArray<SpriteTile>): void
setBackgroundTiles(nextBackgroundTiles: ReadonlyArray<BgTile>): void
setScreenSprites(nextSprites: ReadonlyArray<SpriteInScreen>): void
setScreenBackground(nextBackground: ScreenBackground): void
setPalettes(nextPalettes: ProjectState["palettes"]): void
```

必要な `NesProjectState` は selector か pure function で都度導出します。

### 3.1 なぜこの形にするか

- BG 編集は `backgroundTiles` を更新する
- BG 配置は `screen.background` を更新する
- sprite 配置は `screen.sprites` を更新する
- それぞれの責務が独立し、不要な同期関数が消える

## Presentation 設計

## 1. 新規 BG モード

新規ディレクトリ候補:

- `src/presentation/components/bgMode/`

構成イメージ:

- `core/BgMode.tsx`
- `hooks/useBgModeState.ts`
- `panels/BgModeWorkspacePanel.tsx`
- `canvas/` または既存 sprite canvas の共通化

BGモードの中核 state:

```ts
type BgModeState = {
  activeTileIndex: number;
  activeBackgroundPaletteIndex: 0 | 1 | 2 | 3;
  tool: "pen" | "eraser";
}
```

### 1.1 SpriteMode との差分

- 高さは常に 8
- 並べ替え UI は持たない
- 選択対象数は 256
- 保存先は `backgroundTiles`

## 2. App / Menu

変更対象候補:

- `src/presentation/App.tsx`
- `src/presentation/components/common/menu/FileMenuBar.tsx`
- `src-tauri/src/lib.rs`

必要な変更:

- `WorkMode` に `bg` を追加
- モードメニューへ `BG編集` を追加
- macOS ネイティブメニューイベントを追加
- `App` の main panel 分岐へ `BgMode` を追加

## 3. screenMode の状態分割

新規候補 hook:

- `useScreenModeEditingLayerState`
- `useScreenModeBackgroundPlacementState`
- `useScreenModeBackgroundPaletteState`

分割方針:

- sprite 選択/移動/右クリックは既存 `useScreenModeGestureState`
- BG タイル追加ダイアログと掴み状態は `useScreenModeBackgroundPlacementState` へ切り出す
- BG 属性更新は `useScreenModeBackgroundPaletteState` へ切り出す
- `ScreenModeGestureWorkspace` は編集対象に応じて適切な handler と overlay を切り替える

これにより、既存 sprite E2E を壊しにくくなります。

### 3.1 screenMode の UI 追加要素

追加候補コンポーネント:

- `ScreenModeBackgroundTilePickerDialog`
- `ScreenModeBackgroundPlacementGhost`

役割:

- `ScreenModeBackgroundTilePickerDialog`: 画面配置モードの `BGタイル追加` ボタンから開く大型ダイアログ
- `ScreenModeBackgroundPlacementGhost`: 画面配置モードで掴み状態の BG タイルを 8x8 スナップ済み位置へ重ね表示する

## 状態遷移の整理

### BG編集モード

1. BG タイルを選択する
2. キャンバス上でピクセルを編集する
3. `backgroundTiles[activeTileIndex]` を更新する
4. 必要な renderer / export projection は派生で再計算する

### 画面配置モード BGタイル

1. 編集対象を `BGタイル` に切り替える
2. `BGタイル追加` ボタンを押して選択ダイアログを開く
3. ダイアログで BG タイルのプレビューをクリックし、掴み状態に入る
4. ステージ上で 8x8 スナップ済みプレビュー位置を確認する
5. ステージをクリックして `screen.background.tileIndices` へ保存する
6. 配置確定後に掴み状態を解除する

### 画面配置モード BG属性

1. 編集対象を `BG属性` に切り替える
2. パレット番号 0..3 を選ぶ
3. ステージ上をクリックまたはドラッグする
4. 対応する `screen.background.paletteIndices` を更新する

## 保存形式

## 1. JSON v2 を導入する

今回の設計では保存 JSON を明確に破壊的変更します。
旧形式との自動互換は持ちません。

新しい保存形式の骨子は次です。

```ts
type ProjectStateV2 = {
  formatVersion: 2;
  spriteSize: 8 | 16;
  spriteTiles: ReadonlyArray<SpriteTile>;
  backgroundTiles: ReadonlyArray<BgTile>;
  screen: {
    width: 256;
    height: 240;
    background: {
      widthTiles: 32;
      heightTiles: 30;
      tileIndices: ReadonlyArray<number>;
      paletteIndices: ReadonlyArray<0 | 1 | 2 | 3>;
    };
    sprites: ReadonlyArray<SpriteInScreen>;
  };
  palettes: {
    universalBackgroundColor: NesColorIndex;
    background: NesBackgroundPalettes;
    sprite: NesSpritePalettes;
  };
  ppuControl: {
    backgroundPatternTable: 0 | 1;
    spritePatternTable: 0 | 1;
  };
};
```

この形式では `nes` raw 値を保存しません。
`chrBytes` / `nameTable` / `attributeTable` / `oam` は保存時ではなく、必要時に導出します。

### 1.1 version の扱い

- JSON に `formatVersion: 2` を必須で持たせる
- IndexedDB persist を使うなら key 名も `project-state-v2` に切り替える
- 旧 `project-state` と同じキーに上書き migration しない

## 2. 旧 JSON の扱い

旧 JSON は既定の import 導線では読み込まない前提にします。

理由:

- 旧形式を温存すると source of truth の二重管理が残る
- BG 追加時に schema だけでなく state 更新責務も複雑化する
- ここで壊した方が v1.0 前の整理として筋がよい

必要になった場合だけ、別コマンドまたは別 UI として次を用意します。

- `legacy project import`
- 旧 `nes` raw 値を新 `backgroundTiles` / `screen.background` へ変換する one-shot importer

## テスト方針

## 1. Unit Test

追加対象候補:

- `src/application/state/projectStore.v2.test.ts`
- `src/domain/nes/chr.test.ts`
- `src/domain/screen/backgroundLayout.test.ts`
- `src/domain/screen/backgroundPalette.test.ts`
- `src/domain/nes/projection.test.ts`

最低限必要な確認:

- v2 JSON schema が期待構造だけを受け入れる
- BG tile の encode が期待どおり CHR byte 列を作る
- `screen.background.tileIndices` の `(tileX, tileY)` 更新が正しい index を触る
- `screen.background.paletteIndices` の `(regionX, regionY)` 更新が正しい index を触る
- `buildNesProjection` が `nameTable` / `attributeTable` / `oam` を正しく導出する
- drag 経路で同じセルを何度通っても破綻しない

## 2. 既存 rendering test の拡張

`src/domain/nes/rendering.test.ts` を拡張して次を確認する。

- `backgroundTiles` 更新後に期待タイルが描かれる
- `screen.background.tileIndices` 更新後に期待位置へタイルが出る
- `screen.background.paletteIndices` 更新後に期待パレットで描かれる

## 3. E2E

追加対象候補:

- `e2e/bg-mode.spec.ts`
- `e2e/screen-mode.spec.ts` への追加

確認項目:

- メニューから `BG編集` へ切り替えられる
- BG タイルを編集すると screen preview に反映される
- screenMode の `BGタイル追加` ボタンから大型ダイアログを開ける
- ダイアログ上で BG タイルプレビューをクリックすると掴み状態へ入る
- screenMode の `BGタイル` で 8x8 スナップされた位置にだけクリック配置できる
- screenMode の `BG属性` で属性パレットを塗れる
- 新形式 JSON の保存/復元が通る
- sprite layer の既存操作が壊れていない

## 実装プロセス

今回の実装は、UI を先に作らずドメインロジックを先に固めるテスト駆動開発で進めます。

### 1. ドメイン実装の進め方

ドメイン実装は必ず次の順番で進めます。

1. JSON スキーマを策定する
2. 既存ドメインロジックのテストを更新する
3. 既存ドメインロジックを修正する
4. 新規ドメインロジックのテストを作成する
5. 新規ドメインロジックを作成する

この順番は固定とし、途中で UI 実装へ進まないようにします。

### 2. ドメイン完了時の確認ポイント

次の条件を満たした時点で、いったん実装を止めて確認を取ります。

- v2 JSON schema が固まっている
- 既存ドメインロジックの修正が完了している
- 新規ドメインロジックが追加されている
- 対象ドメインテストが通っている

この確認が終わるまでは UI 実装へ進みません。

### 3. UI 実装の進め方

UI 実装も一気に本実装へ入れず、段階を分けます。

1. 先に UI のガワだけを作る
2. 画面構成、レイアウト、操作導線、ラベルを確認してもらう
3. 確認後に初めてドメインロジックを UI へ載せる

ここでいうガワとは、次を指します。

- モード切り替え
- パネル構成
- プレースホルダー表示
- 操作ボタンや選択 UI
- ステージ上の表示枠やオーバーレイ

この段階では、実際の BG 編集ロジックや screen 更新ロジックはまだ接続しません。

## 実装順

1. JSON スキーマを策定する
2. 既存ドメインロジックのテストを更新する
3. 既存ドメインロジックを修正する
4. 新規ドメインロジックのテストを作成する
5. 新規ドメインロジックを作成する
6. ドメインロジックが通った時点で確認を取る
7. UI のガワだけを作る
8. UI の見た目と導線を確認してもらう
9. 確認後に UI へドメインロジックを載せる
10. 必要な E2E を追加する
11. 必要なら legacy importer を別導線で追加する

## 非目標

今回の設計では次を対象外とします。

- 複数 nametable の編集
- scroll / mirroring の再現
- sprite と BG の別 CHR bank 運用の完全再現
- BG 専用の矩形塗り、塗りつぶし、レイヤー管理
- universal background color の専用 UI

特に `backgroundPatternTable` / `spritePatternTable` の完全な NES bank 分離は、今回の state 正規化とは独立の論点なので、別タスクとして扱う方が安全です。

## 最終判断

実装コストと既存構造への適合を踏まえると、次の構成が最も安全です。

- 新規トップレベルモード `BG編集` を追加する
- 保存 JSON は v2 として破壊的に更新し、`backgroundTiles` / `screen.background` を正本にする
- `nes` raw 値は保存対象から外し、renderer / export / 制約チェック用に導出する
- 画面配置モードには `スプライト` / `BGタイル` / `BG属性` の編集対象切り替えを足す
- sprite 用ジェスチャー実装は維持し、BG 編集は別 hook に切り出す

この方針なら JSON 互換を引きずらずに二重管理を解消し、BG 編集と BG 配置を素直なデータモデルで実装できます。
