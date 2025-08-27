import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatModelName(modelId: string): string {
  if (!modelId) return "Unknown Model"
  
  // Clean up model names for display
  return modelId
    .replace('llama3-', 'Llama 3 ')
    .replace('llama-4-', 'Llama 4 ')
    .replace('mixtral-', 'Mixtral ')
    .replace('gemma2-', 'Gemma 2 ')
    .replace('-8192', '')
    .replace('-32768', '')
    .replace('-4096', '')
    .replace('-1m', ' 1M')
    .replace('-it', ' IT')
    .replace('-instruct', ' Instruct')
    .replace('-scout', ' Scout')
    .replace('-maverick', ' Maverick')
    .replace('-8b', ' 8B')
    .replace('-70b', ' 70B')
    .replace('-9b', ' 9B')
    .replace('-8x7b', ' 8x7B')
}
