import React from "react";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeStageStore } from "./characterModeStageStore";
import { useCharacterModeStageSize } from "./characterModeEditorState";

const resetStores = () => {
  useCharacterModeStageStore.setState(
    useCharacterModeStageStore.getInitialState(),
  );
  useCharacterModeDecompositionStore.setState(
    useCharacterModeDecompositionStore.getInitialState(),
  );
};

afterEach(resetStores);

describe("characterModeStageStore", () => {
  it("useCharacterModeStageSize updates width and resizes the decomposition canvas", () => {
    const stageSizeRef: {
      current: O.Option<ReturnType<typeof useCharacterModeStageSize>>;
    } = {
      current: O.none,
    };

    const Probe = () => {
      stageSizeRef.current = O.some(useCharacterModeStageSize());
      return React.createElement(React.Fragment);
    };

    renderToStaticMarkup(React.createElement(Probe));
    pipe(
      stageSizeRef.current,
      O.map((stageSize) => stageSize.handleStageWidthChange("64")),
    );

    expect(useCharacterModeStageStore.getState().stageWidth).toBe(64);
    expect(
      useCharacterModeDecompositionStore.getState().decompositionCanvas.width,
    ).toBe(64);
  });

  it("useCharacterModeStageSize ignores non-integer width input", () => {
    const stageSizeRef: {
      current: O.Option<ReturnType<typeof useCharacterModeStageSize>>;
    } = {
      current: O.none,
    };

    const Probe = () => {
      stageSizeRef.current = O.some(useCharacterModeStageSize());
      return React.createElement(React.Fragment);
    };

    renderToStaticMarkup(React.createElement(Probe));
    pipe(
      stageSizeRef.current,
      O.map((stageSize) => stageSize.handleStageWidthChange("abc")),
    );

    expect(useCharacterModeStageStore.getState().stageWidth).toBe(16);
  });

  it("handleZoomIn and handleZoomOut clamp zoom levels", () => {
    useCharacterModeStageStore.setState({ stageZoomLevel: 5 });

    useCharacterModeStageStore.getState().handleZoomIn();
    expect(useCharacterModeStageStore.getState().stageZoomLevel).toBe(6);

    useCharacterModeStageStore.getState().handleZoomIn();
    expect(useCharacterModeStageStore.getState().stageZoomLevel).toBe(6);

    useCharacterModeStageStore.setState({
      stageZoomLevel: 2,
      viewportPanState: O.none,
    });

    useCharacterModeStageStore.getState().handleZoomOut();
    expect(useCharacterModeStageStore.getState().stageZoomLevel).toBe(1);

    useCharacterModeStageStore.getState().handleZoomOut();
    expect(useCharacterModeStageStore.getState().stageZoomLevel).toBe(1);
  });
});
