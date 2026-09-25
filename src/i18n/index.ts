import { en, TranslationStrings } from "./locales/en";
import { ja } from "./locales/ja";

export type { TranslationStrings };

export function getLanguage(): string {
  try {
    if (typeof (window as any)?.moment?.locale === "function") {
      const loc = (window as any).moment.locale();
      if (loc) {
        return loc.toLowerCase();
      }
    }
    if (typeof (globalThis as any)?.moment?.locale === "function") {
      const loc = (globalThis as any).moment.locale();
      if (loc) {
        return loc.toLowerCase();
      }
    }
  } catch {
    // Fallback if moment is inaccessible
  }
  return "en";
}

export function getTranslations(lang = getLanguage()): TranslationStrings {
  if (lang.startsWith("ja")) {
    return ja;
  }
  return en;
}

export function t(): TranslationStrings {
  return getTranslations();
}
