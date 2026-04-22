import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeSetDraft: vi.fn(),
    useCharacterModeSetName: vi.fn(),
    useCharacterModeSetSelection: vi.fn(),
  };
});

vi.mock("../../logic/characterModeEditorState", () => {
  return {
    useCharacterModeSetDraft: mockedHooks.useCharacterModeSetDraft,
    useCharacterModeSetName: mockedHooks.useCharacterModeSetName,
    useCharacterModeSetSelection: mockedHooks.useCharacterModeSetSelection,
  };
});

import { CharacterModeSetDraftFields } from "./CharacterModeSetDraftFields";
import { CharacterModeSetSelectionFields } from "./CharacterModeSetSelectionFields";

describe("CharacterMode set fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeSetDraft.mockReturnValue({
      newName: "新規セット",
      handleCreateSet: vi.fn(),
      handleNewNameChange: vi.fn(),
    });
    mockedHooks.useCharacterModeSetName.mockReturnValue({
      activeSetName: "既存セット",
      handleSetNameChange: vi.fn(),
    });
    mockedHooks.useCharacterModeSetSelection.mockReturnValue({
      selectedCharacterId: O.some("set-1"),
      characterSets: [
        {
          id: "set-1",
          name: "既存セット",
          sprites: [],
        },
      ],
      handleDeleteSet: vi.fn(),
      handleSelectSet: vi.fn(),
    });
  });

  it("renders the draft action without custom wrapper tokens", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeSetDraftFields),
    );

    expect(markup).toContain("セットを作成");
    expect(markup).not.toContain("character-set-draft-action-container");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toContain("app-field-label");
    expect(markup).toContain('data-tone="accent"');
    expect(markup).toContain('data-variant="solid"');
  });

  it("renders the selection actions without custom wrapper tokens", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeSetSelectionFields),
    );

    expect(markup).toContain("セット名変更");
    expect(markup).toContain("セットを削除");
    expect(markup).toContain("既存セット (0 sprites)");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toContain("app-field-label");
    expect(markup).toContain('data-tone="neutral"');
    expect(markup).toContain('data-tone="danger"');
    expect(markup).not.toMatch(/data-active=/);
  });
});
