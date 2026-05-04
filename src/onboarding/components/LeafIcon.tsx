import { SVGProps } from "react";

export function LeafIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11 20A7 7 0 0 1 4 13V6a2 2 0 0 1 2-2h6a8 8 0 0 1 8 8v0a8 8 0 0 1-8 8h-1Z" />
      <path d="M4 20s2-6 8-9" />
    </svg>
  );
}
