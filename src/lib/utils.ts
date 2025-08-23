
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

const AVATAR_COLORS = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
];

export function generateAvatarColor(id: string) {
    const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = charCodeSum % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}
