import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do tailwind com clsx para criar strings de classe condicionais
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma string para apresentação, capitalizando palavras e substituindo hífens por espaços
 */
export function formatDisplayText(text: string): string {
  return text
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
} 