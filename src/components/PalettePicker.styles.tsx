// Palette.styles.tsx
import { css } from "@emotion/react";
import styled from "@emotion/styled";

export const Root = styled.div`
    display: grid;
    gap: 8px;
`;

export const SlotRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const SlotButton = styled.button<{
    active?: boolean;
    transparent?: boolean;
    bg?: string;
}>`
    width: 32px;
    height: 32px;
    cursor: pointer;
    border: ${(p) => (p.active ? "3px solid #333" : "1px solid #888")};
    ${(p) =>
        p.transparent
            ? css`
                  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%);
                  background-size: 8px 8px;
              `
            : css`
                  background: ${p.bg};
              `}
`;

export const ScrollWrap = styled.div`
    overflow-x: auto;
    max-width: 100%;
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(16, 18px);
    gap: 4px;
    border: 1px solid #aaa;
    padding: 6px;
    width: ${16 * 18 + 15 * 4 + 12}px; /* 固定幅 */
`;

export const ColorCell = styled.div<{ bg: string }>`
    width: 18px;
    height: 18px;
    background: ${(p) => p.bg};
    border: 1px solid #00000022;
    cursor: pointer;
`;

export const Note = styled.small`
    color: #555;
`;
