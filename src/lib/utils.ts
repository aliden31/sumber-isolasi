import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateDocumentId(prefix: string) {
  const now = new Date();
  const dateStr = now.getDate().toString().padStart(2, '0') +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getFullYear();
  
  // Generate a short random string
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `${prefix}-${dateStr}-${randomStr}`;
}
