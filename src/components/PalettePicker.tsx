import React, { useState } from "react";
import { NesColorIndex, Palettes, useProjectState } from "../../src/store/projectState";
import { NES_PALETTE_HEX } from "../nes/palette";
import { ColorCell, Grid, Note, Root, ScrollWrap, SlotButton, SlotRow } from "./PalettePicker.styles";

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

    return (
        <Root>
            <div>現在のパレット: {activePalette}</div>
            {palettes.map((palette, i) => {
                return (
                    <React.Fragment key={i}>
                        <div>Palette {i}</div>
                        <SlotRow>
                            {palette.map((idx, j) => (
                                <React.Fragment key={j}>
                                    <SlotButton
                                        onClick={j !== 0 ? () => handlePaletteClick(i, j) : undefined}
                                        title={j === 0 ? "Slot 0: Transparent" : `Slot ${j}`}
                                        active={activeSlot === j && activePalette === i}
                                        transparent={j === 0}
                                        bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                                    />
                                    <div>slot{j}</div>
                                </React.Fragment>
                            ))}
                        </SlotRow>
                    </React.Fragment>
                );
            })}

            <ScrollWrap>
                <Grid>
                    {NES_PALETTE_HEX.map((hex, idx) => (
                        <ColorCell
                            key={idx}
                            onClick={() => setSlot(activeSlot, idx)}
                            title={`#${idx.toString(16).padStart(2, "0").toUpperCase()}`}
                            bg={hex}
                        />
                    ))}
                </Grid>
            </ScrollWrap>

            <Note>注意: Slot0は「透明扱い」です。実際の色は描画しません（チェッカ柄表示）。</Note>
        </Root>
    );
};
