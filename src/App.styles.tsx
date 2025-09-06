// App.styles.tsx
import { css } from "@emotion/react";
import styled from "@emotion/styled";

// レイアウト全体
export const Container = styled.div`
    display: grid;
    grid-template-columns: 1fr minmax(320px, 420px); /* 右ペイン可変幅 */
    gap: 16px;
    padding: 16px;
    font-family: ui-sans-serif, system-ui;
    align-items: start; /* ★ 追加: 左右のペインを同じ高さに伸ばさない */
`;

export const LeftPane = styled.div`
    display: grid;
    gap: 12px;
    grid-auto-rows: max-content; /* ★ 追加: 各行は内容サイズで確定 */
    align-content: start; /* ★ 追加: 余白で行を縦に引き伸ばさない */
`;

export const RightPane = styled.div`
    display: grid;
    gap: 12px;
`;

// ツールバー
export const Toolbar = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const Spacer = styled.div`
    width: 24px;
`;

export const ToolButton = styled.button<{ active?: boolean }>`
    padding: 4px 8px;
    border: ${(p) => (p.active ? "2px solid #333" : "1px solid #aaa")};
    background: #fff;
    cursor: pointer;
    /* 必要なら保険として明示（なくても上記修正で十分） */
    align-self: start; /* ★ 任意: グリッド行の縦伸びの影響を受けない */
`;

// 描画色ボタン（1/2/3）
export const ColorButton = styled.button<{ active?: boolean; bg: string }>`
    width: 28px;
    height: 28px;
    cursor: pointer;
    border: ${(p) => (p.active ? "3px solid #333" : "1px solid #aaa")};
    background: ${(p) => p.bg};
`;

// 透明色ボタン
export const TransparentButton = styled.button<{ active?: boolean }>`
    width: 28px;
    height: 28px;
    cursor: pointer;
    border: ${(p) => (p.active ? "3px solid #333" : "1px solid #aaa")};
    background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%);
    background-size: 8px 8px;
`;

// キャンバス下の操作行
export const CanvasActions = styled.div`
    display: flex;
    gap: 8px;
`;

// 見出し
export const H3 = styled.h3`
    margin: 0;
`;

export const H4 = styled.h4`
    margin: 8px 0 4px;
`;

// 現在の4色表示
export const CurrentColors = styled.div`
    display: flex;
    gap: 8px;
`;

export const SwatchWrap = styled.div`
    text-align: center;
    font-size: 12px;
`;

export const Swatch = styled.div<{ bg?: string; transparent?: boolean }>`
    width: 32px;
    height: 32px;
    border: 1px solid #00000022;
    ${(p) =>
        p.transparent
            ? css`
                  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%);
                  background-size: 8px 8px;
              `
            : css`
                  background: ${p.bg ?? "#fff"};
              `}
`;

export const SmallNote = styled.small`
    color: #555;
`;
