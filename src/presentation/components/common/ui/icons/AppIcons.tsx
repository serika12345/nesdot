import React from "react";

interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  readonly title?: string;
}

const SvgIcon: React.FC<
  AppIconProps & {
    readonly children: React.ReactNode;
  }
> = ({ children, title, ...props }) => {
  const hasTitle = typeof title === "string" && title.length > 0;

  return (
    <svg
      aria-hidden={hasTitle === true ? "false" : "true"}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {hasTitle === true ? <title>{title}</title> : <></>}
      {children}
    </svg>
  );
};

export const CheckIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M3.5 8.5L6.5 11.5L12.5 4.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const ChevronDownIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const ChevronRightIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const DesktopIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <rect
      height="7.5"
      rx="1.1"
      stroke="currentColor"
      strokeWidth="1.25"
      width="11"
      x="2.5"
      y="2.75"
    />
    <path
      d="M6 12H10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M8 10.25V12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);

export const CodeIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M6 5L3.5 8L6 11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M10 5L12.5 8L10 11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M8.8 3.5L7.2 12.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const DashboardIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <rect
      height="4"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.25"
      width="4"
      x="2.5"
      y="2.5"
    />
    <rect
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.25"
      width="5"
      x="8.5"
      y="2.5"
    />
    <rect
      height="4"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.25"
      width="4"
      x="2.5"
      y="9.5"
    />
    <rect
      height="1"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="1.25"
      width="5"
      x="8.5"
      y="12.5"
    />
  </SvgIcon>
);

export const MoonIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M10.9 2.9C9.7 3.2 8.6 4 7.9 5C7.2 6 7 7.2 7.3 8.4C7.6 9.6 8.4 10.7 9.4 11.4C10.4 12.1 11.6 12.3 12.8 12C12 12.7 11 13.1 9.9 13.2C8.8 13.4 7.6 13.2 6.6 12.7C5.5 12.2 4.6 11.4 4 10.4C3.4 9.4 3.1 8.3 3.2 7.1C3.3 6 3.7 4.9 4.4 4C5.1 3.1 6.1 2.4 7.2 2C8.4 1.6 9.7 1.6 10.9 1.9"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);

export const DrawIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M11.5 2.5L13.5 4.5L6 12H4V10L11.5 2.5Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
    <path
      d="M9.5 4.5L11.5 6.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);

export const SunIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M8 2V3.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M8 12.5V14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M14 8H12.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M3.5 8H2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M12.25 3.75L11.2 4.8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M4.8 11.2L3.75 12.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M12.25 12.25L11.2 11.2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M4.8 4.8L3.75 3.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);

export const FileUploadIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M8 10.5V3.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
    <path
      d="M5.5 6L8 3.5L10.5 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M3 12.5H13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const ImageIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <rect
      height="11"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.25"
      width="11"
      x="2.5"
      y="2.5"
    />
    <circle cx="6" cy="6" fill="currentColor" r="1" />
    <path
      d="M4 11L6.75 8.25L8.75 10.25L10 9L12 11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);

export const InfoIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25" />
    <circle cx="8" cy="5.2" fill="currentColor" r="0.8" />
    <path
      d="M8 7.25V10.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const UndoIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M6 5H4V3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M4 5.25C5.2 4.1 6.55 3.5 8.15 3.5C10.85 3.5 12.85 5.1 13 7.75C13.15 10.4 11.05 12.5 8.25 12.5H5.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const RedoIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M10 5H12V3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M12 5.25C10.8 4.1 9.45 3.5 7.85 3.5C5.15 3.5 3.15 5.1 3 7.75C2.85 10.4 4.95 12.5 7.75 12.5H10.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const SaveIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M3 2.5H11L13 4.5V13.5H3V2.5Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
    <path
      d="M5 2.5V6H10V2.5"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
    <rect
      height="2.5"
      rx="0.6"
      stroke="currentColor"
      strokeWidth="1.25"
      width="4"
      x="6"
      y="9"
    />
  </SvgIcon>
);

export const ShareIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="4" cy="8" fill="currentColor" r="1.1" />
    <circle cx="11.8" cy="4" fill="currentColor" r="1.1" />
    <circle cx="11.8" cy="12" fill="currentColor" r="1.1" />
    <path
      d="M5 7.4L10.8 4.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M5 8.6L10.8 11.4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);

export const TextureIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <rect
      height="10"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.25"
      width="10"
      x="3"
      y="3"
    />
    <path d="M6 3V13" stroke="currentColor" strokeWidth="1.25" />
    <path d="M10 3V13" stroke="currentColor" strokeWidth="1.25" />
    <path d="M3 6H13" stroke="currentColor" strokeWidth="1.25" />
    <path d="M3 10H13" stroke="currentColor" strokeWidth="1.25" />
  </SvgIcon>
);

export const UpdateIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <path
      d="M12 6V3.5H9.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M12 3.75C11 2.9 9.75 2.4 8.4 2.4C5.3 2.4 2.8 4.85 2.8 7.95C2.8 11.05 5.3 13.5 8.4 13.5C10.95 13.5 13.08 11.8 13.75 9.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </SvgIcon>
);

export const WallpaperIcon: React.FC<AppIconProps> = (props) => (
  <SvgIcon {...props}>
    <rect
      height="9"
      rx="1.25"
      stroke="currentColor"
      strokeWidth="1.25"
      width="11"
      x="2.5"
      y="3"
    />
    <path
      d="M5.25 13V11.25H10.75V13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
    <path
      d="M4.25 9.5L6.75 7.25L8.5 8.75L10 7.5L11.75 9.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </SvgIcon>
);
