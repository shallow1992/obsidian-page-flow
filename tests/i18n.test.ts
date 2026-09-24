import { describe, expect, it } from "vitest";
import { getTranslations } from "../src/i18n";
import { en } from "../src/i18n/locales/en";
import { ja } from "../src/i18n/locales/ja";

describe("i18n translation system", () => {
  it("returns Japanese translations when language is ja", () => {
    const translations = getTranslations("ja");
    expect(translations.commands.scrollOrNext).toBe("進む: 下にスクロール または 次のファイルへ");
    expect(translations.settings.title).toBe("Page Flow 設定");
  });

  it("returns English translations when language is en", () => {
    const translations = getTranslations("en");
    expect(translations.commands.scrollOrNext).toBe("Forward: Scroll down or go to next file");
    expect(translations.settings.title).toBe("Page Flow Settings");
  });

  it("falls back to English when language is unsupported", () => {
    const translations = getTranslations("fr");
    expect(translations).toBe(en);
  });

  it("ensures Japanese and English dictionaries have complete structure matching", () => {
    // Check all command keys exist
    for (const key of Object.keys(en.commands) as Array<keyof typeof en.commands>) {
      expect(ja.commands[key]).toBeDefined();
      expect(ja.commands[key].length).toBeGreaterThan(0);
    }

    // Check all setting keys exist
    for (const key of Object.keys(en.settings) as Array<keyof typeof en.settings>) {
      expect(ja.settings[key]).toBeDefined();
    }

    // Check sortOrder options
    for (const key of Object.keys(en.settings.sortOrder.options) as Array<
      keyof typeof en.settings.sortOrder.options
    >) {
      expect(ja.settings.sortOrder.options[key]).toBeDefined();
      expect(ja.settings.sortOrder.options[key].length).toBeGreaterThan(0);
    }

    // Check notices
    for (const key of Object.keys(en.notices) as Array<keyof typeof en.notices>) {
      expect(ja.notices[key]).toBeDefined();
      expect(ja.notices[key].length).toBeGreaterThan(0);
    }
  });
});
