import React from "react";
import { NES_PALETTE_HEX } from "../nes/palette";
import { NesColorIndex, Palette4 } from "../nes/types";

interface Props {
    palette: Palette4;
    onChange: (next: Palette4) => void;
}

export const PalettePicker: React.FC<Props> = ({ palette, onChange }) => {
    const [activeSlot, setActiveSlot] = React.useState<number>(1); // 0は透明スロット扱い

    const setSlot = (slot: number, idx: NesColorIndex) => {
        const next = [...palette] as Palette4;
        next[slot] = idx;
        onChange(next);
    };

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {palette.map((idx, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveSlot(i)}
                        title={i === 0 ? "Slot 0: Transparent" : `Slot ${i}`}
                        style={{
                            width: 32,
                            height: 32,
                            border: activeSlot === i ? "3px solid #333" : "1px solid #888",
                            background: i === 0 ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)" : NES_PALETTE_HEX[idx],
                            backgroundSize: i === 0 ? "8px 8px" : undefined,
                            cursor: "pointer",
                        }}
                    />
                ))}
            </div>
            <div
                style={{ display: "grid", gridTemplateColumns: "repeat(16, 18px)", gap: 4, border: "1px solid #aaa", padding: 6 }}
            >
                {NES_PALETTE_HEX.map((hex, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSlot(activeSlot, idx)}
                        title={`#${idx.toString(16).padStart(2, "0").toUpperCase()}`}
                        style={{
                            width: 18,
                            height: 18,
                            background: hex,
                            border: "1px solid #00000022",
                            cursor: "pointer",
                        }}
                    />
                ))}
            </div>
            <small style={{ color: "#555" }}>注意: Slot0は「透明扱い」です。実際の色は描画しません（チェッカ柄表示）。</small>
        </div>
    );
};
