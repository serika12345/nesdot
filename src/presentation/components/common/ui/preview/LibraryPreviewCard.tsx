import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import styles from "./LibraryPreviewCard.module.css";

interface LibraryPreviewCardProps extends Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "style"
> {
  readonly badge?: React.ReactNode;
  readonly dragging?: boolean;
  readonly interactive?: boolean;
  readonly label: React.ReactNode;
  readonly previewFrame?: "sprite";
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
    previewFrame,
    selected,
    type = "button",
    ...props
  },
  ref,
) {
  const isActive = selected === true || dragging === true;

  return (
    <button
      ref={ref}
      {...props}
      className={mergeClassNames(
        styles.card ?? "",
        previewFrame === "sprite" ? (styles.spriteFrame ?? "") : false,
        interactive === true ? (styles.interactive ?? "") : false,
        dragging === true ? (styles.dragging ?? "") : false,
        typeof className === "string" ? className : false,
      )}
      aria-pressed={selected === true}
      data-active={isActive === true ? "true" : "false"}
      type={type}
    >
      <span className={styles.content}>
        <span className={styles.preview}>{preview}</span>
        <span className={styles.label}>{label}</span>
        {badge}
      </span>
    </button>
  );
});
