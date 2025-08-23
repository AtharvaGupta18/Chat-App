import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

export function WhisperLinkLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M17.5 10.5c1.42 0 2.5-1.34 2.5-3s-1.08-3-2.5-3-2.5 1.34-2.5 3c0 .8.34 1.51.89 2.01" />
      <path d="M6.5 15.5c1.42 0 2.5-1.34 2.5-3s-1.08-3-2.5-3-2.5 1.34-2.5 3c0 .8.34 1.51.89 2.01" />
      <path d="M14 18.27v-2.02c0-1.22-.84-2.25-2-2.25H8" />
      <path d="M10 9.27V7.25C10 6.03 10.84 5 12 5h4" />
      <path d="M22 13.5a7.5 7.5 0 0 1-15 0c0-4.14 3.36-7.5 7.5-7.5" />
      <path d="M2 18.5a7.5 7.5 0 0 1 15 0c0 4.14-3.36 7.5-7.5 7.5" />
    </svg>
  );
}
