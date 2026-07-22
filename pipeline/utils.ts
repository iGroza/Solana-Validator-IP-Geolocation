import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { StyleFn } from "https://deno.land/x/progressbar@v0.2.0/progressbar.ts";
import { bar } from "https://deno.land/x/progressbar@v0.2.0/styles.ts";

export function getMsgStyle(msg: string) {
  return {
    style: (...args: Parameters<StyleFn>) =>
      `${bar(...args)} ${colors.bold(msg)}`,
  };
}

export function sanitizeCsvValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[,\n]/g, " ").replace(/["']/g, "");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1)); // Exponential backoff
      }
    }
  }

  throw lastError;
}
