import React from "react";
import styles from "./SurfaceCard.module.css";

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children?: React.ReactNode;
}

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  function SurfaceCard({ children, className, ...props }, ref) {
    const combinedClassName =
      typeof className === "string" && className.length > 0
        ? `${styles.root} ${className}`
        : styles.root;

    return (
      <div {...props} ref={ref} className={combinedClassName}>
        {children}
      </div>
    );
  },
);
