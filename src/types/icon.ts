import type { ComponentType, SVGProps } from "react";

export type LucideIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;
