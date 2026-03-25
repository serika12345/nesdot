import { css } from "@emotion/react";
import styled from "@emotion/styled";

type ButtonTone = "neutral" | "primary" | "danger";
type BadgeTone = "neutral" | "accent" | "danger";

const buttonStyleOptions = (active?: boolean, tone?: ButtonTone) => ({
  ...(active === true ? { active: true } : {}),
  ...(active === false ? { active: false } : {}),
  ...(tone === "neutral" || tone === "primary" || tone === "danger"
    ? { tone }
    : {}),
});

const badgeStyleOptions = (tone?: BadgeTone) => ({
  ...(tone === "neutral" || tone === "accent" || tone === "danger"
    ? { tone }
    : {}),
});

const buttonStyles = ({
  active = false,
  tone = "neutral",
}: {
  active?: boolean;
  tone?: ButtonTone;
}) => {
  if (tone === "danger") {
    return css`
      color: #fff1f2;
      background: linear-gradient(135deg, #be123c 0%, #9f1239 100%);
      border: 1px solid rgba(159, 18, 57, 0.4);
      box-shadow: 0 12px 24px rgba(190, 24, 93, 0.2);
    `;
  }

  if (tone === "primary" || active) {
    return css`
      color: #f0fdfa;
      background: linear-gradient(135deg, #0f766e 0%, #155e75 100%);
      border: 1px solid rgba(21, 94, 117, 0.35);
      box-shadow: 0 14px 26px rgba(15, 118, 110, 0.22);
    `;
  }

  return css`
    color: var(--ink-strong);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.96),
      rgba(241, 245, 249, 0.92)
    );
    border: 1px solid rgba(148, 163, 184, 0.24);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  `;
};

const badgeStyles = ({ tone = "neutral" }: { tone?: BadgeTone }) => {
  if (tone === "accent") {
    return css`
      color: #0f766e;
      background: rgba(15, 118, 110, 0.12);
      border: 1px solid rgba(15, 118, 110, 0.18);
    `;
  }

  if (tone === "danger") {
    return css`
      color: #be123c;
      background: rgba(190, 24, 93, 0.1);
      border: 1px solid rgba(190, 24, 93, 0.16);
    `;
  }

  return css`
    color: var(--ink-soft);
    background: rgba(148, 163, 184, 0.12);
    border: 1px solid rgba(148, 163, 184, 0.18);
  `;
};

export const globalStyles = css`
  :root {
    --ink-strong: #0f172a;
    --ink: #1e293b;
    --ink-soft: #64748b;
    --panel-surface: rgba(255, 255, 255, 0.94);
    --panel-surface-strong: rgba(255, 255, 255, 0.98);
    --panel-border: rgba(148, 163, 184, 0.22);
    --panel-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    --canvas-shell: #081320;
    --canvas-shell-alt: #10253b;
  }

  * {
    box-sizing: border-box;
  }

  html {
    height: 100%;
    background:
      radial-gradient(
        circle at 12% 12%,
        rgba(56, 189, 248, 0.18),
        transparent 24%
      ),
      radial-gradient(
        circle at 88% 18%,
        rgba(45, 212, 191, 0.14),
        transparent 20%
      ),
      linear-gradient(180deg, #07111d 0%, #0d1726 48%, #101827 100%);
  }

  body {
    margin: 0;
    height: 100%;
    min-width: 0;
    color: var(--ink);
    font-family:
      "Avenir Next", "SF Pro Display", "Segoe UI", "Helvetica Neue", sans-serif;
    background: transparent;
    overflow: hidden;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.48), transparent 80%);
    pointer-events: none;
  }

  button,
  input,
  select {
    font: inherit;
  }

  #root {
    height: 100vh;
    overflow: hidden;
  }

  ::selection {
    background: rgba(45, 212, 191, 0.32);
  }
`;

export const Container = styled.div`
  position: relative;
  z-index: 1;
  height: 100vh;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
  padding: 24px;
  overflow: hidden;

  @media (max-width: 980px) {
    padding: 16px;
  }
`;

export const Eyebrow = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.92);
`;

export const ModeSwitcherCard = styled.section`
  display: grid;
  width: 100%;
  padding: 14px;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94),
    rgba(248, 250, 252, 0.9)
  );
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(18px);
`;

export const ModeSwitcherLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  gap: 12px;
  align-items: center;

  @media (max-width: 1120px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ModeSwitcherHeader = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const ModeSwitcherTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--ink-strong);
`;

export const SegmentedControl = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.18);
`;

export const SegmentedButton = styled.button<{ active?: boolean }>`
  appearance: none;
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
  ${({ active }) => buttonStyles(buttonStyleOptions(active))}

  &:hover {
    transform: translateY(-1px);
  }
`;

export const WorkspaceGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
  min-height: 0;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 16px;
  }

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    overflow: auto;
  }
`;

export const LeftPane = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const RightPane = styled.aside`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
  align-content: stretch;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 980px) {
    grid-template-rows: auto auto;
    min-height: auto;
  }
`;

export const Panel = styled.section`
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    var(--panel-surface-strong),
    var(--panel-surface)
  );
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(18px);

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto auto 0;
    width: 180px;
    height: 180px;
    background: radial-gradient(
      circle,
      rgba(45, 212, 191, 0.09) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

export const PanelHeader = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 5px;
`;

export const PanelHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--ink-strong);
`;

export const PanelDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-soft);
`;

export const H3 = styled.h3`
  margin: 0;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`;

export const Spacer = styled.div`
  flex: 1 1 24px;
  min-width: 12px;
`;

export const ToolButton = styled.button<{
  active?: boolean;
  tone?: ButtonTone;
}>`
  appearance: none;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease,
    opacity 160ms ease;
  ${({ active, tone }) => buttonStyles(buttonStyleOptions(active, tone))}

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const ActionButton = ToolButton;

export const CollapseToggle = styled.button<{ open?: boolean }>`
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 9px 12px;
  border: 1px solid
    ${(p) => (p.open ? "rgba(15, 118, 110, 0.2)" : "rgba(148, 163, 184, 0.18)")};
  background: ${(p) =>
    p.open ? "rgba(15, 118, 110, 0.1)" : "rgba(248, 250, 252, 0.88)"};
  color: ${(p) => (p.open ? "#0f766e" : "var(--ink-soft)")};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform 160ms ease,
    background 160ms ease,
    border-color 160ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

export const ActionCluster = styled.div`
  position: relative;
  z-index: 3;
  width: min(100%, 320px);
`;

export const ActionButtonsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
`;

export const IconActionButton = styled.button<{ active?: boolean }>`
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 16px;
  white-space: nowrap;
  border: 1px solid
    ${(p) =>
      p.active ? "rgba(15, 118, 110, 0.22)" : "rgba(148, 163, 184, 0.2)"};
  background: ${(p) =>
    p.active
      ? "linear-gradient(180deg, rgba(240, 253, 250, 0.98), rgba(236, 253, 245, 0.9))"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92))"};
  color: ${(p) => (p.active ? "#0f766e" : "var(--ink-strong)")};
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

export const IconLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

export const ActionMenu = styled.div`
  position: fixed;
  min-width: 220px;
  max-width: min(320px, calc(100vw - 32px));
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
  z-index: 9999;
`;

export const ActionMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9998;
`;

export const ActionMenuButton = styled.button`
  appearance: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ink-strong);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  transition: background 160ms ease;

  &:hover {
    background: rgba(15, 23, 42, 0.05);
  }
`;

export const CanvasActions = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const FieldGrid = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
  align-items: end;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Field = styled.label`
  display: grid;
  gap: 8px;
`;

export const FieldLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
`;

export const NumberInput = styled.input`
  appearance: none;
  width: 100%;
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(248, 250, 252, 0.92);
  color: var(--ink-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);

  &:focus {
    outline: none;
    border-color: rgba(15, 118, 110, 0.4);
    box-shadow:
      0 0 0 4px rgba(15, 118, 110, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
  }
`;

export const SelectInput = styled.select`
  appearance: none;
  width: 100%;
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.96),
      rgba(248, 250, 252, 0.92)
    ),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%2364748B' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
      no-repeat right 14px center / 14px;
  color: var(--ink-strong);
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: rgba(15, 118, 110, 0.4);
    box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1);
  }
`;

export const Badge = styled.span<{ tone?: BadgeTone }>`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  ${({ tone }) => badgeStyles(badgeStyleOptions(tone))}
`;

export const SplitLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 340px) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  min-height: 0;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
`;

export const CanvasViewport = styled.div`
  position: relative;
  z-index: 1;
  overflow: auto;
  display: grid;
  min-height: 0;
  border-radius: 24px;
  padding: 18px;
  background:
    radial-gradient(circle at top, rgba(30, 41, 59, 0.3), transparent 40%),
    linear-gradient(180deg, var(--canvas-shell-alt), var(--canvas-shell));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  scrollbar-gutter: stable both-edges;
`;

export const ScrollColumn = styled.div`
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-auto-rows: max-content;
  gap: 16px;
  align-content: start;
  padding-right: 4px;
  scrollbar-gutter: stable both-edges;

  > * {
    align-self: start;
  }
`;

export const ScrollArea = styled.div`
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  scrollbar-gutter: stable both-edges;
`;

export const MetricGrid = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
`;

export const MetricCard = styled.div`
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

export const MetricLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
`;

export const MetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink-strong);
`;

export const DetailList = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

export const DetailKey = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
`;

export const DetailValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-strong);
  text-align: right;
`;

export const HelperText = styled.p`
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-soft);
`;

export const Divider = styled.div`
  position: relative;
  z-index: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.18),
    rgba(148, 163, 184, 0.02)
  );
`;
