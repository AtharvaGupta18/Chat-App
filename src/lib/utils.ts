import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  const names = name.trim().split(' ').filter(n => n);
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return names[0][0].toUpperCase();
  }
  const firstNameInitial = names[0][0];
  const lastNameInitial = names[names.length - 1][0];
  return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
}
