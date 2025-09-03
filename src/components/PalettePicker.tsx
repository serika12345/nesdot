import React, { useState } from "react";
import { NesColorIndex, Palette4Colors, Palettes, useProjectState } from "../../src/store/projectState";
import { NES_PALETTE_HEX } from "../nes/palette";
import { ColorCell, Grid, Note, Root, ScrollWrap, SlotButton, SlotRow } from "./PalettePicker.styles";

export const PalettePicker: React.FC = () => {
    const currentSelectPalette = useProjectState((s) => s.currentSelectPalette);
    const palettes = useProjectState((s) => s.palettes);
    const setPalette = (p: Palette4Colors) => {
        const next = [...palettes] as Palettes;
        next[currentSelectPalette] = p;
        useProjectState.setState({ palettes: next });
    };
    const [activeSlot, setActiveSlot] = useState<number>(1); // 0は透明スロット扱い

    const setSlot = (slot: number, idx: NesColorIndex) => {
        const next = [...palettes] as Palettes;
        next[currentSelectPalette][slot] = idx;
        useProjectState.setState({ palettes: next });
    };

    return (
        <Root>
            <div>現在のパレット: {currentSelectPalette}</div>
            <SlotRow>
                {palettes[currentSelectPalette].map((idx, i) => (
                    <SlotButton
                        key={i}
                        onClick={() => setActiveSlot(i)}
                        title={i === 0 ? "Slot 0: Transparent" : `Slot ${i}`}
                        active={activeSlot === i}
                        transparent={i === 0}
                        bg={i === 0 ? undefined : NES_PALETTE_HEX[idx]}
                    />
                ))}
            </SlotRow>

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
