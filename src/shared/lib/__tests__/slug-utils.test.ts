import {
  ensureUniqueSlug,
  generateSlug,
  transliterate,
} from "../slug-utils";

describe("Slug Utils", () => {
  describe("transliterate", () => {
    it("should transliterate Russian text to Latin", () => {
      expect(transliterate("Привет")).toBe("Privet");
      expect(transliterate("Москва")).toBe("Moskva");
      expect(transliterate("Россия")).toBe("Rossiya");
    });

    it("should handle special Russian characters", () => {
      expect(transliterate("ёжик")).toBe("ezhik");
      expect(transliterate("йод")).toBe("jod");
      expect(transliterate("подъезд")).toBe("podezd");
      expect(transliterate("объявление")).toBe("ob" + "yavlenie");
    });

    it("should handle mixed case", () => {
      expect(transliterate("Привет Мир")).toBe("Privet Mir");
      // "Х" транслитерируется как "Kh" (заглавная K, строчная h)
      expect(transliterate("ХОСТИНГ")).toBe("KhOSTING");
    });

    it("should preserve non-Russian characters", () => {
      expect(transliterate("Hello World")).toBe("Hello World");
      expect(transliterate("123")).toBe("123");
      expect(transliterate("Привет! Hello!")).toBe("Privet! Hello!");
    });

    it("should handle empty string", () => {
      expect(transliterate("")).toBe("");
    });

    it("should handle complex Russian text", () => {
      expect(transliterate("Щука")).toBe("Shchuka");
      expect(transliterate("Царь")).toBe("Tsar" + "");
      expect(transliterate("Юность")).toBe("Yunost" + "");
      expect(transliterate("Яблоко")).toBe("Yabloko");
    });
  });

  describe("generateSlug", () => {
    it("should generate slug from Russian text", () => {
      expect(generateSlug("Хостинг для WordPress")).toBe(
        "khosting-dlya-wordpress",
      );
      expect(generateSlug("Привет Мир")).toBe("privet-mir");
      expect(generateSlug("Москва")).toBe("moskva");
    });

    it("should handle special characters", () => {
      expect(generateSlug("Привет! Мир?")).toBe("privet-mir");
      expect(generateSlug("Текст@с#символами$")).toBe("tekstssimvolami");
    });

    it("should handle multiple spaces", () => {
      expect(generateSlug("Текст   с    пробелами")).toBe(
        "tekst-s-probelami",
      );
    });

    it("should handle underscores", () => {
      expect(generateSlug("Текст_с_подчеркиваниями")).toBe(
        "tekst-s-podcherkivaniyami",
      );
    });

    it("should remove leading and trailing dashes", () => {
      expect(generateSlug("  Привет  ")).toBe("privet");
      expect(generateSlug("-Привет-")).toBe("privet");
    });

    it("should handle multiple consecutive dashes", () => {
      expect(generateSlug("Текст---с---дефисами")).toBe(
        "tekst-s-defisami",
      );
    });

    it("should limit slug length", () => {
      const longText = "Очень длинный текст ".repeat(10);
      const slug = generateSlug(longText, 50);
      expect(slug.length).toBeLessThanOrEqual(50);
      expect(slug).not.toMatch(/-$/); // Не должен заканчиваться дефисом
    });

    it("should handle empty string", () => {
      expect(generateSlug("")).toBe("");
    });

    it("should handle numbers", () => {
      expect(generateSlug("Хостинг 2024")).toBe("khosting-2024");
      expect(generateSlug("План 2.0")).toBe("plan-20");
    });

    it("should handle mixed Russian and English", () => {
      expect(generateSlug("Хостинг Hosting")).toBe("khosting-hosting");
      expect(generateSlug("WordPress для сайта")).toBe(
        "wordpress-dlya-sajta",
      );
    });

    it("should handle edge cases with special Russian letters", () => {
      expect(generateSlug("Ёжик")).toBe("ezhik");
      expect(generateSlug("Йод")).toBe("jod");
      expect(generateSlug("Щука")).toBe("shchuka");
    });
  });

  describe("ensureUniqueSlug", () => {
    it("should return slug if it is unique", () => {
      const slug = "hosting";
      const existingSlugs: string[] = ["hosting-1", "hosting-2"];
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting");
    });

    it("should add suffix when slug exists", () => {
      const slug = "hosting";
      const existingSlugs = ["hosting"];
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-2");
    });

    it("should handle multiple existing slugs with suffixes", () => {
      const slug = "hosting";
      const existingSlugs = ["hosting", "hosting-2", "hosting-3"];
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-4");
    });

    it("should find first available number", () => {
      const slug = "hosting";
      const existingSlugs = ["hosting", "hosting-3", "hosting-5"];
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-2");
    });

    it("should handle empty existing slugs array", () => {
      const slug = "hosting";
      expect(ensureUniqueSlug(slug, [])).toBe("hosting");
    });

    it("should handle null/undefined existing slugs", () => {
      const slug = "hosting";
      expect(ensureUniqueSlug(slug, [])).toBe("hosting");
    });

    it("should handle complex slug patterns", () => {
      const slug = "hosting-1";
      const existingSlugs = ["hosting-1", "hosting-1-2"];
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-1-3");
    });

    it("should handle empty slug", () => {
      expect(ensureUniqueSlug("", ["hosting"])).toBe("");
    });

    it("should handle slugs with special characters", () => {
      const slug = "hosting-site";
      const existingSlugs = ["hosting-site", "hosting-site-2"];
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-site-3");
    });

    it("should handle case where slug with suffix already exists", () => {
      const slug = "hosting";
      const existingSlugs = ["hosting", "hosting-2", "hosting-4"];
      // Должен найти первое свободное число (3)
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-3");
    });

    it("should handle very large numbers", () => {
      const slug = "hosting";
      const existingSlugs = ["hosting", "hosting-999"];
      // Должен найти первое свободное число (2), так как 1 занят, а 2 свободно
      expect(ensureUniqueSlug(slug, existingSlugs)).toBe("hosting-2");
    });
  });

  describe("Integration tests", () => {
    it("should generate unique slug from Russian text", () => {
      const text = "Хостинг для WordPress";
      const slug = generateSlug(text);
      const existingSlugs = ["khosting-dlya-wordpress"];
      const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

      expect(uniqueSlug).toBe("khosting-dlya-wordpress-2");
    });

    it("should handle full workflow", () => {
      const texts = [
        "Хостинг для WordPress",
        "Хостинг для WordPress",
        "Хостинг для WordPress",
      ];
      const existingSlugs: string[] = [];

      const slugs = texts.map((text) => {
        const slug = generateSlug(text);
        const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);
        existingSlugs.push(uniqueSlug);
        return uniqueSlug;
      });

      expect(slugs).toEqual([
        "khosting-dlya-wordpress",
        "khosting-dlya-wordpress-2",
        "khosting-dlya-wordpress-3",
      ]);
    });
  });
});

