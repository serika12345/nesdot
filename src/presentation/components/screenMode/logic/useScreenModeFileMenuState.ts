import * as O from "fp-ts/Option";
import { useMemo } from "react";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import {
  type FileMenuState,
  emptyFileMenuState,
} from "../../common/logic/state/fileMenuState";
import { useScreenModeProjectActions } from "./useScreenModeProjectActions";
import { useScreenModeProjectState } from "./useScreenModeProjectState";

export const useScreenModeFileMenuState = (): FileMenuState => {
  const { scan } = useScreenModeProjectState();
  const setSelectedSpriteIndex = useWorkbenchState(
    (state) => state.setScreenModeSelectedSpriteIndex,
  );
  const { handleImport, projectActions } = useScreenModeProjectActions({
    scan,
    setSelectedSpriteIndex,
  });

  return useMemo(
    () => ({
      ...emptyFileMenuState,
      shareActions: projectActions,
      restoreAction: O.some({
        label: "復元",
        onSelect: handleImport,
      }),
    }),
    [handleImport, projectActions],
  );
};
