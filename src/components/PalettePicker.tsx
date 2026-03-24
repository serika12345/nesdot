import React, { useState } from "react";
import { NesColorIndex, Palettes, useProjectState } from "../../src/store/projectState";
import { NES_PALETTE_HEX } from "../nes/palette";
import {
    ColorCell,
    Grid,
    LibraryCaption,
    LibraryHeader,
    LibraryTitle,
    Note,
    PaletteCaption,
    PaletteCard,
    PaletteHeader,
    PaletteList,
    PaletteName,
    PaletteStatus,
    Root,
    ScrollWrap,
    SelectionLabel,
    SelectionSummary,
    SelectionSwatch,
    SelectionValue,
    SlotButton,
    SlotGroup,
    SlotLabel,
    SlotRow,
} from "./PalettePicker.styles";

export const PalettePicker: React.FC = () => {
    const palettes = useProjectState((s) => s.palettes);
    const [activePalette, setActivePalette] = useState<number>(0);
    const [activeSlot, setActiveSlot] = useState<number>(1); // 0は透明スロット扱い

    const handlePaletteClick = (activePalette: number, activeSlot: number) => {
        setActivePalette(activePalette);
        setActiveSlot(activeSlot);
    };

    const setSlot = (slotIndex: number, idx: NesColorIndex) => {
        const next = [...palettes] as Palettes;
        next[activePalette][slotIndex] = idx;
        useProjectState.setState({ palettes: next });
    };

    const activeColorIndex = palettes[activePalette][activeSlot];
    const activeColorHex = NES_PALETTE_HEX[activeColorIndex];

    return (
        <Root>
            <SelectionSummary>
                <div>
                    <SelectionLabel>現在の編集先</SelectionLabel>
                    <SelectionValue>
                        Palette {activePalette} / Slot {activeSlot}
                    </SelectionValue>
                </div>
                <SelectionSwatch
                    transparent={activeSlot === 0}
                    bg={activeSlot === 0 ? undefined : activeColorHex}
                    title={`#${activeColorIndex.toString(16).padStart(2, "0").toUpperCase()}`}
                />
            </SelectionSummary>

            <PaletteList>
                {palettes.map((palette, i) => {
                    const isActivePalette = activePalette === i;

                    return (
                        <PaletteCard key={i} active={isActivePalette}>
                            <PaletteHeader>
                                <div>
                                    <PaletteName>Palette {i}</PaletteName>
                                    <PaletteCaption>{isActivePalette ? "編集中のパレット" : "クリックで切り替え"}</PaletteCaption>
                                </div>
                                <PaletteStatus active={isActivePalette}>{isActivePalette ? "Active" : "Idle"}</PaletteStatus>
                            </PaletteHeader>

                            <SlotRow>
                                {palette.map((idx, j) => (
                                    <SlotGroup key={j} active={isActivePalette && activeSlot === j}>
                                        <SlotButton
                                            onClick={j !== 0 ? () => handlePaletteClick(i, j) : undefined}
                                            title={j === 0 ? "Slot 0: Transparent" : `Slot ${j}`}
                                            active={activeSlot === j && isActivePalette}
                                            transparent={j === 0}
                                            bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                                        />
                                        <SlotLabel>slot{j}</SlotLabel>
                                    </SlotGroup>
                                ))}
                            </SlotRow>
                        </PaletteCard>
                    );
                })}
            </PaletteList>

            <ScrollWrap>
                <LibraryHeader>
                    <div>
                        <LibraryTitle>NES Color Library</LibraryTitle>
                        <LibraryCaption>
                            Palette {activePalette} / Slot {activeSlot} に割り当てる色を選択
                        </LibraryCaption>
                    </div>
                    <PaletteStatus active>
                        #{activeColorIndex.toString(16).padStart(2, "0").toUpperCase()}
                    </PaletteStatus>
                </LibraryHeader>
                <Grid>
                    {NES_PALETTE_HEX.map((hex, idx) => (
                        <ColorCell
                            key={idx}
                            onClick={() => setSlot(activeSlot, idx)}
                            title={`#${idx.toString(16).padStart(2, "0").toUpperCase()}`}
                            bg={hex}
                            active={idx === activeColorIndex}
                        />
                    ))}
                </Grid>
            </ScrollWrap>

            <Note>注意: Slot0は「透明扱い」です。実際の色は描画しません（チェッカ柄表示）。</Note>
        </Root>
    );
};
