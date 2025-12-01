/**
 * Site Validation Tests
 * Unit тесты для валидации схем Site
 */

import { createSiteSchema, updateSiteSchema } from "@/entities/site/model/validation";
import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";

describe("Site Validation", () => {
  describe("createSiteSchema", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        name: "Мой сайт",
      };

      const result = createSiteSchema.parse(validData);

      expect(result).toEqual(validData);
      expect(result.name).toBe("Мой сайт");
    });

    it("должен отклонять пустое название", () => {
      const invalidData = {
        name: "",
      };

      expect(() => createSiteSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять название длиннее 100 символов", () => {
      const invalidData = {
        name: "a".repeat(101),
      };

      expect(() => createSiteSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен принимать название длиной ровно 100 символов", () => {
      const validData = {
        name: "a".repeat(100),
      };

      const result = createSiteSchema.parse(validData);
      expect(result.name).toBe("a".repeat(100));
    });

    it("должен обрезать пробелы в начале и конце", () => {
      const validData = {
        name: "  Мой сайт  ",
      };

      const result = createSiteSchema.parse(validData);
      expect(result.name).toBe("Мой сайт");
    });
  });

  describe("updateSiteSchema", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        name: "Обновленный сайт",
      };

      const result = updateSiteSchema.parse(validData);

      expect(result).toEqual(validData);
      expect(result.name).toBe("Обновленный сайт");
    });

    it("должен принимать пустой объект", () => {
      const validData = {};

      const result = updateSiteSchema.parse(validData);

      expect(result).toEqual({});
      expect(result.name).toBeUndefined();
    });

    it("должен отклонять пустое название", () => {
      const invalidData = {
        name: "",
      };

      expect(() => updateSiteSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять название длиннее 100 символов", () => {
      const invalidData = {
        name: "a".repeat(101),
      };

      expect(() => updateSiteSchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});

