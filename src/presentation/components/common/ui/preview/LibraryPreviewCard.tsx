import React from "react";
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
  const baseClassName = styles.card ?? "";
  const cardClassName = [
    baseClassName,
    isActive === true ? (styles.cardActive ?? "") : "",
    dragging === true ? (styles.cardDragging ?? "") : "",
    interactive === true ? (styles.cardInteractive ?? "") : "",
    previewFrame === "sprite" ? (styles.cardSpriteFrame ?? "") : "",
    className,
  ]
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");

  return (
    <button
      ref={ref}
      {...props}
      className={cardClassName}
      aria-pressed={selected === true}
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
