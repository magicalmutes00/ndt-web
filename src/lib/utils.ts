import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string) {
  return phone.replace(/(\d{5})(\d{5})/, "$1 $2");
}
