import { Button } from "@radix-ui/themes";
import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import styles from "./LibraryPreviewCard.module.css";

const LIBRARY_PREVIEW_CARD_STYLE: React.CSSProperties = {
  width: "100%",
  alignItems: "stretch",
  justifyContent: "flex-start",
  minHeight: "6rem",
  padding: "0.75rem",
  whiteSpace: "normal",
};

interface LibraryPreviewCardProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "color" | "size" | "variant"
> {
  readonly badge?: React.ReactNode;
  readonly dragging?: boolean;
  readonly interactive?: boolean;
  readonly label: React.ReactNode;
  readonly selected?: boolean;
  readonly preview: React.ReactNode;
}

export const LibraryPreviewCard = React.forwardRef<
  HTMLButtonElement,
  LibraryPreviewCardProps
>(function LibraryPreviewCard(
  {
    badge,
    className,
    dragging,
    interactive = true,
    label,
    preview,
    selected,
    style,
    ...props
  },
  ref,
) {
  const isActive = selected === true || dragging === true;

  return (
    <Button
      ref={ref}
      {...props}
      className={mergeClassNames(
        styles.card ?? "",
        interactive === true ? (styles.interactive ?? "") : false,
        dragging === true ? (styles.dragging ?? "") : false,
        typeof className === "string" ? className : false,
      )}
      aria-pressed={selected === true}
      color={isActive === true ? "teal" : "gray"}
      size="1"
      style={{ ...LIBRARY_PREVIEW_CARD_STYLE, ...(style ?? {}) }}
      variant={isActive === true ? "solid" : "surface"}
    >
      <span className={styles.content}>
        {preview}
        <span className={styles.label}>{label}</span>
        {badge}
      </span>
    </Button>
  );
});
