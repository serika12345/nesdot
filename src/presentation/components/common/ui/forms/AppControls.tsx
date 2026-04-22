import React from "react";
import { createPortal } from "react-dom";
import { mergeClassNames } from "../../../../styleClassNames";
import { ChevronDownIcon } from "../icons/AppIcons";
import styles from "./AppControls.module.css";

type ButtonTone = "accent" | "danger" | "neutral";
type ButtonVariant = "outline" | "solid" | "surface";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly fullWidth?: boolean;
  readonly size?: "medium" | "small";
  readonly tone?: ButtonTone;
  readonly variant?: ButtonVariant;
}

interface AppBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: ButtonTone;
}

type AppSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

type AppInputProps = React.InputHTMLAttributes<HTMLInputElement>;

interface AppSwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
}

interface AppDialogProps {
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly onClose: () => void;
  readonly open: boolean;
  readonly size?: "large" | "medium" | "small";
  readonly title: React.ReactNode;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(
    {
      children,
      className,
      fullWidth,
      size = "medium",
      tone = "neutral",
      variant = "outline",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        className={mergeClassNames(styles.button ?? "", className ?? false)}
        data-full-width={fullWidth === true ? "true" : "false"}
        data-size={size}
        data-tone={tone}
        data-variant={variant}
        type={props.type ?? "button"}
      >
        {children}
      </button>
    );
  },
);

export const AppIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    readonly tone?: ButtonTone;
  }
>(function AppIconButton(
  { children, className, tone = "neutral", ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      className={mergeClassNames(styles.iconButton ?? "", className ?? false)}
      data-tone={tone}
      type={props.type ?? "button"}
    >
      {children}
    </button>
  );
});

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  className,
  tone = "neutral",
  ...props
}) => {
  return (
    <span
      {...props}
      className={mergeClassNames(styles.chip ?? "", className ?? false)}
      data-tone={tone}
    >
      {children}
    </span>
  );
};

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  function AppInput({ className, ...props }, ref) {
    return (
      <input
        {...props}
        ref={ref}
        className={mergeClassNames(styles.input ?? "", className ?? false)}
      />
    );
  },
);

export const AppSelect = React.forwardRef<HTMLSelectElement, AppSelectProps>(
  function AppSelect({ children, className, ...props }, ref) {
    return (
      <span className={styles.selectWrap}>
        <select
          {...props}
          ref={ref}
          className={mergeClassNames(styles.select ?? "", className ?? false)}
        >
          {children}
        </select>
        <ChevronDownIcon className={styles.selectIcon} />
      </span>
    );
  },
);

export const AppFieldLabel: React.FC<
  React.LabelHTMLAttributes<HTMLLabelElement>
> = ({ children, className, ...props }) => {
  return (
    <label
      {...props}
      className={mergeClassNames(styles.fieldLabel ?? "", className ?? false)}
    >
      {children}
    </label>
  );
};

export const AppSwitch: React.FC<AppSwitchProps> = ({
  checked,
  className,
  onCheckedChange,
  ...props
}) => {
  return (
    <button
      {...props}
      aria-checked={checked}
      className={mergeClassNames(styles.switch ?? "", className ?? false)}
      data-checked={checked === true ? "true" : "false"}
      role="switch"
      type="button"
      onClick={(event) => {
        props.onClick?.(event);

        if (event.defaultPrevented === true) {
          return;
        }

        onCheckedChange(checked === false);
      }}
    >
      <span className={styles.switchThumb} />
    </button>
  );
};

export const AppDialog: React.FC<AppDialogProps> = ({
  actions,
  children,
  onClose,
  open,
  size = "medium",
  title,
}) => {
  const titleId = React.useId();

  React.useEffect(() => {
    if (open === false) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (open === false) {
    return <></>;
  }

  const hasActions = typeof actions !== "undefined";

  const dialogNode = (
    <div
      className={styles.dialogOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        onClose();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialogContent}
        data-size={size}
        role="dialog"
      >
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle} id={titleId}>
            {title}
          </h2>
        </div>
        <div className={styles.dialogBody}>{children}</div>
        {hasActions === false ? (
          <></>
        ) : (
          <div className={styles.dialogActions}>{actions}</div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return dialogNode;
  }

  return createPortal(dialogNode, document.body);
};

export const visuallyHiddenClassName = styles.visuallyHidden;
