import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  const names = name.trim().split(' ');
  if (names.length === 1 && names[0] !== '') {
    return names[0].substring(0, 2).toUpperCase();
  }
  const initials = names.map((n) => n[0]).join('');
  return (initials.length > 2 ? initials.substring(0, 2) : initials).toUpperCase();
}
