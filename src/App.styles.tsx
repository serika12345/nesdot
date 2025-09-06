// App.styles.tsx
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

// キャンバス下の操作行
export const CanvasActions = styled.div`
    display: flex;
    gap: 8px;
`;

// 見出し
export const H3 = styled.h3`
    margin: 0;
`;
