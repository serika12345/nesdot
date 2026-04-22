import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as O from "fp-ts/Option";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-menubar", () => {
  const Root = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>) =>
    React.createElement("div", { role: "menubar", ...props }, children);
  const Menu = ({ children }: React.PropsWithChildren<Record<string, never>>) =>
    React.createElement(React.Fragment, {}, children);
  const Trigger = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement("button", props, children);
  const Portal = ({
    children,
  }: React.PropsWithChildren<Record<string, never>>) =>
    React.createElement(React.Fragment, {}, children);
  const Content = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>) =>
    React.createElement("div", { role: "menu", ...props }, children);
  const Item = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement("button", { role: "menuitem", ...props }, children);
  const Sub = ({ children }: React.PropsWithChildren<Record<string, never>>) =>
    React.createElement(React.Fragment, {}, children);
  const SubTrigger = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement("button", { role: "menuitem", ...props }, children);
  const SubContent = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>) =>
    React.createElement("div", { role: "menu", ...props }, children);
  const Separator = (props: React.ComponentPropsWithoutRef<"hr">) =>
    React.createElement("hr", props);
  const RadioGroup = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>) =>
    React.createElement("div", props, children);
  const RadioItem = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement(
      "button",
      { role: "menuitemradio", ...props },
      children,
    );

  return {
    Root,
    Menu,
    Trigger,
    Portal,
    Content,
    Item,
    Sub,
    SubTrigger,
    SubContent,
    Separator,
    RadioGroup,
    RadioItem,
  };
});

vi.mock("@radix-ui/themes", () => {
  const Button = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement("button", props, children);
  const Root = ({ children }: React.PropsWithChildren<Record<string, never>>) =>
    React.createElement(React.Fragment, {}, children);
  const Content = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>) =>
    React.createElement("div", props, children);
  const Title = ({
    children,
  }: React.PropsWithChildren<Record<string, never>>) =>
    React.createElement("h2", {}, children);

  return {
    Button,
    Dialog: {
      Root,
      Content,
      Title,
    },
  };
});

const mockedUpdateCheck = vi.hoisted(() => {
  return {
    canRequestAvailableUpdateCheck: vi.fn(),
    requestAvailableUpdateCheck: vi.fn(),
  };
});

vi.mock("../../../../../infrastructure/browser/updateCheck", () => {
  return mockedUpdateCheck;
});

import { MenuBar } from "./MenuBar";

describe("MenuBar", () => {
  it("renders the application menu landmark and selected work mode as a radio item", () => {
    mockedUpdateCheck.canRequestAvailableUpdateCheck.mockReturnValue(false);

    const markup = renderToStaticMarkup(
      React.createElement(MenuBar, {
        editMode: "bg",
        fileMenuState: {
          restoreAction: O.none,
          shareActions: [],
        },
        onEditModeSelect: vi.fn(),
        onRedoSelect: vi.fn(),
        onUndoSelect: vi.fn(),
      }),
    );

    expect(markup).toContain('aria-label="アプリケーションメニュー"');
    expect(markup).toContain('role="menubar"');
    expect(markup).toContain('aria-label="作業モードメニュー"');
    expect(markup).toContain('value="bg"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('role="menuitemradio"');
  });
});
