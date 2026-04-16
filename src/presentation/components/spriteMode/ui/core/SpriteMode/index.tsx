import Stack from "@mui/material/Stack";
import * as O from "fp-ts/Option";
import React from "react";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { SpriteModeCanvasPanel } from "../../panels/SpriteModeCanvasPanel";
import { SpriteModeEditorPanel } from "../../panels/SpriteModeEditorPanel";
import {
  SpriteModeStateProvider,
  useSpriteModeProjectActions,
} from "../SpriteModeStateProvider";

interface SpriteModeProps {
  render: (params: {
    fileMenuState: FileMenuState;
    panel: React.ReactNode;
  }) => React.ReactNode;
}

const SpriteModeContent: React.FC<SpriteModeProps> = ({ render }) => {
  const projectActions = useSpriteModeProjectActions();
  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions.projectActions,
      restoreAction: O.some({
        label: "復元",
        onSelect: projectActions.handleImport,
      }),
    }),
    [projectActions.handleImport, projectActions.projectActions],
  );

  return render({
    fileMenuState,
    panel: (
      <Stack
        useFlexGap
        direction={{ xs: "column", lg: "row" }}
        spacing="1rem"
        minHeight={0}
        flex={1}
        height="100%"
      >
        <SpriteModeEditorPanel />
        <SpriteModeCanvasPanel />
      </Stack>
    ),
  });
};

/**
 * スプライト編集モード全体の UI を描画します。
 * 個別スプライト編集、パレット選択、書き出し、並べ替えを一つの画面にまとめるコンポーネントです。
 */
const SpriteModeComponent: React.FC<SpriteModeProps> = ({ render }) => {
  return (
    <SpriteModeStateProvider>
      <SpriteModeContent render={render} />
    </SpriteModeStateProvider>
  );
};

export const SpriteMode = React.memo(SpriteModeComponent);
