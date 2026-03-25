import React, { useState } from "react";
import { CollapseToggle } from "../App.styles";
import { NesColorIndex, Palettes, useProjectState } from "../../src/store/projectState";
import { NES_PALETTE_HEX } from "../nes/palette";
import {
    ColorCell,
    Grid,
    LibraryCaption,
    LibraryHeader,
    Note,
    PaletteCard,
    PaletteHeader,
    PaletteList,
    PaletteName,
    PaletteStatus,
    Root,
    ScrollWrap,
    SelectionSummary,
    SelectionSwatch,
    SelectionValue,
    SlotButton,
    SlotGroup,
    SlotLabel,
    SlotRow,
} from "./PalettePicker.styles";
import { ChevronIcon } from "./ui/Icons";

export const PalettePicker: React.FC = () => {
    const palettes = useProjectState((s) => s.palettes);
    const [activePalette, setActivePalette] = useState<number>(0);
    const [activeSlot, setActiveSlot] = useState<number>(1); // 0は透明スロット扱い
    const [isPaletteListOpen, setIsPaletteListOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const handlePaletteClick = (activePalette: number, activeSlot: number) => {
        setActivePalette(activePalette);
        setActiveSlot(activeSlot);
        setIsLibraryOpen(true);
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
                    <SelectionValue>パレット {activePalette} / スロット {activeSlot}</SelectionValue>
                </div>
                <SelectionSwatch
                    transparent={activeSlot === 0}
                    bg={activeSlot === 0 ? undefined : activeColorHex}
                    title={`#${activeColorIndex.toString(16).padStart(2, "0").toUpperCase()}`}
                />
            </SelectionSummary>

            <div css={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <CollapseToggle type="button" open={isPaletteListOpen} onClick={() => setIsPaletteListOpen((prev) => !prev)}>
                    {isPaletteListOpen ? "パレットを閉じる" : "パレットを開く"}
                    <ChevronIcon open={isPaletteListOpen} />
                </CollapseToggle>
                <CollapseToggle type="button" open={isLibraryOpen} onClick={() => setIsLibraryOpen((prev) => !prev)}>
                    {isLibraryOpen ? "色ライブラリを閉じる" : "色ライブラリを開く"}
                    <ChevronIcon open={isLibraryOpen} />
                </CollapseToggle>
            </div>

            {isPaletteListOpen && (
                <PaletteList>
                    {palettes.map((palette, i) => {
                        const isActivePalette = activePalette === i;

                        return (
                            <PaletteCard key={i} active={isActivePalette}>
                                <PaletteHeader>
                                    <PaletteName>パレット {i}</PaletteName>
                                </PaletteHeader>

                                <SlotRow>
                                    {palette.map((idx, j) => (
                                        <SlotGroup key={j} active={isActivePalette && activeSlot === j}>
                                            <SlotButton
                                                onClick={j !== 0 ? () => handlePaletteClick(i, j) : undefined}
                                                title={j === 0 ? "スロット 0: 透明" : `スロット ${j}`}
                                                active={activeSlot === j && isActivePalette}
                                                transparent={j === 0}
                                                bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                                            />
                                            <SlotLabel>スロット{j}</SlotLabel>
                                        </SlotGroup>
                                    ))}
                                </SlotRow>
                            </PaletteCard>
                        );
                    })}
                </PaletteList>
            )}

            {isLibraryOpen && (
                <ScrollWrap>
                    <LibraryHeader>
                        <LibraryCaption>パレット {activePalette} / スロット {activeSlot} に割り当てる色を選択</LibraryCaption>
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
            )}

            <Note>注意: スロット0は「透明扱い」です。実際の色は描画しません（チェッカ柄表示）。</Note>
        </Root>
    );
};
