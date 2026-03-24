import { css } from "@emotion/react";
import styled from "@emotion/styled";

export const Root = styled.div`
    position: relative;
    z-index: 1;
    display: grid;
    gap: 18px;
`;

export const SelectionSummary = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(240, 253, 250, 0.94), rgba(236, 253, 245, 0.82));
    border: 1px solid rgba(15, 118, 110, 0.16);
`;

export const SelectionLabel = styled.div`
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
`;

export const SelectionValue = styled.div`
    margin-top: 6px;
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--ink-strong);
`;

export const SelectionSwatch = styled.div<{ bg?: string; transparent?: boolean }>`
    width: 54px;
    height: 54px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    ${(p) =>
        p.transparent
            ? css`
                  background: repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%);
                  background-size: 12px 12px;
              `
            : css`
                  background: ${p.bg};
              `}
`;

export const PaletteList = styled.div`
    display: grid;
    gap: 12px;
`;

export const PaletteCard = styled.div<{ active?: boolean }>`
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 22px;
    background: ${(p) =>
        p.active
            ? "linear-gradient(180deg, rgba(240, 253, 250, 0.96), rgba(236, 253, 245, 0.86))"
            : "rgba(248, 250, 252, 0.84)"};
    border: 1px solid ${(p) => (p.active ? "rgba(15, 118, 110, 0.18)" : "rgba(148, 163, 184, 0.16)")};
    box-shadow: ${(p) => (p.active ? "0 18px 30px rgba(15, 118, 110, 0.12)" : "none")};
`;

export const PaletteHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const PaletteName = styled.div`
    font-size: 16px;
    font-weight: 700;
    color: var(--ink-strong);
`;

export const PaletteCaption = styled.div`
    margin-top: 4px;
    font-size: 12px;
    color: var(--ink-soft);
`;

export const PaletteStatus = styled.span<{ active?: boolean }>`
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${(p) => (p.active ? "#0f766e" : "var(--ink-soft)")};
    background: ${(p) => (p.active ? "rgba(15, 118, 110, 0.12)" : "rgba(148, 163, 184, 0.1)")};
    border: 1px solid ${(p) => (p.active ? "rgba(15, 118, 110, 0.16)" : "rgba(148, 163, 184, 0.14)")};
`;

export const SlotRow = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
`;

export const SlotGroup = styled.div<{ active?: boolean }>`
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 10px 8px;
    border-radius: 18px;
    background: ${(p) => (p.active ? "rgba(15, 118, 110, 0.1)" : "rgba(255, 255, 255, 0.58)")};
    border: 1px solid ${(p) => (p.active ? "rgba(15, 118, 110, 0.16)" : "rgba(148, 163, 184, 0.1)")};
`;

export const SlotLabel = styled.div`
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
`;

export const SlotButton = styled.button<{
    active?: boolean;
    transparent?: boolean;
    bg?: string;
}>`
    width: 42px;
    height: 42px;
    border-radius: 14px;
    cursor: pointer;
    border: ${(p) => (p.active ? "3px solid #0f766e" : "1px solid rgba(148, 163, 184, 0.28)")};
    box-shadow: ${(p) => (p.active ? "0 12px 24px rgba(15, 118, 110, 0.16)" : "0 8px 16px rgba(15, 23, 42, 0.06)")};
    transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        border-color 160ms ease;

    &:hover {
        transform: translateY(-1px);
    }

    ${(p) =>
        p.transparent
            ? css`
                  background: repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%);
                  background-size: 10px 10px;
              `
            : css`
                  background: ${p.bg};
              `}
`;

export const ScrollWrap = styled.div`
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 24px;
    background: rgba(248, 250, 252, 0.84);
    border: 1px solid rgba(148, 163, 184, 0.14);
`;

export const LibraryHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
`;

export const LibraryTitle = styled.div`
    font-size: 16px;
    font-weight: 700;
    color: var(--ink-strong);
`;

export const LibraryCaption = styled.div`
    margin-top: 4px;
    font-size: 12px;
    color: var(--ink-soft);
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 8px;
`;

export const ColorCell = styled.button<{ bg: string; active?: boolean }>`
    appearance: none;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    background: ${(p) => p.bg};
    cursor: pointer;
    border: ${(p) => (p.active ? "3px solid #0f172a" : "1px solid rgba(15, 23, 42, 0.08)")};
    box-shadow: ${(p) => (p.active ? "0 12px 18px rgba(15, 23, 42, 0.18)" : "0 8px 14px rgba(15, 23, 42, 0.08)")};
    transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        border-color 160ms ease;

    &:hover {
        transform: translateY(-1px);
    }
`;

export const Note = styled.small`
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink-soft);
`;
