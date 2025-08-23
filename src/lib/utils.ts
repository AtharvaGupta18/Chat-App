
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
    { bg: "bg-blue-500", ring: "ring-blue-600" },
    { bg: "bg-green-500", ring: "ring-green-600" },
    { bg: "bg-purple-500", ring: "ring-purple-600" },
    { bg: "bg-red-500", ring: "ring-red-600" },
    { bg: "bg-yellow-500", ring: "ring-yellow-600" },
    { bg: "bg-indigo-500", ring: "ring-indigo-600" },
    { bg: "bg-pink-500", ring: "ring-pink-600" },
    { bg: "bg-teal-500", ring: "ring-teal-600" },
];

export function generateAvatarColor(id: string) {
    const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = charCodeSum % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}
