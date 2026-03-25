import React from "react";

type IconProps = {
  size?: number;
  className?: string;
};

type BaseSvgProps = Pick<
  React.SVGProps<SVGSVGElement>,
  "fill" | "stroke" | "strokeWidth" | "strokeLinecap" | "strokeLinejoin"
>;

const baseProps: BaseSvgProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const ShareIcon: React.FC<IconProps> = ({ size = 18, className }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...baseProps}
    >
      <path d="M14 5l5 4-5 4" />
      <path d="M19 9h-8a5 5 0 0 0-5 5v5" />
      <path d="M10 19H5" />
    </svg>
  );
};

export const ImportIcon: React.FC<IconProps> = ({ size = 18, className }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...baseProps}
    >
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
};

export const ChevronIcon: React.FC<IconProps & { open?: boolean }> = ({
  size = 16,
  className,
  open = false,
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 160ms ease",
      }}
      {...baseProps}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
};
