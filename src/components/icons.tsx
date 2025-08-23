
import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

export function GlimpseLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <path d="M3 12a9 9 0 1 0 11.83-8.62" />
      <path d="M21 4.17V8h-3.83" />
      <path d="M12 12a3 3 0 1 0-3-3" />
    </svg>
  );
}
