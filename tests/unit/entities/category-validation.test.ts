/**
 * Category Validation Tests
 * Unit тесты для валидации схем Category
 */

import { createCategorySchema, updateCategorySchema } from "@/entities/category/model/validation";
import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";

describe("Category Validation", () => {
  const validCuid = "clx1234567890123456789012";

  describe("createCategorySchema", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        name: "Категория товаров",
        siteIds: [validCuid],
      };

      const result = createCategorySchema.parse(validData);

      expect(result).toEqual(validData);
      expect(result.name).toBe("Категория товаров");
      expect(result.siteIds).toHaveLength(1);
    });

    it("должен валидировать данные с несколькими сайтами", () => {
      const validData = {
        name: "Категория товаров",
        siteIds: [validCuid, "clx9876543210987654321098"],
      };

      const result = createCategorySchema.parse(validData);

      expect(result.siteIds).toHaveLength(2);
    });

    it("должен отклонять пустое название", () => {
      const invalidData = {
        name: "",
        siteIds: [validCuid],
      };

      expect(() => createCategorySchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять название длиннее 200 символов", () => {
      const invalidData = {
        name: "a".repeat(201),
        siteIds: [validCuid],
      };

      expect(() => createCategorySchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять пустой массив siteIds", () => {
      const invalidData = {
        name: "Категория",
        siteIds: [],
      };

      expect(() => createCategorySchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять некорректный CUID в siteIds", () => {
      const invalidData = {
        name: "Категория",
        siteIds: ["invalid-cuid"],
      };

      expect(() => createCategorySchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe("updateCategorySchema", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        name: "Обновленная категория",
        siteIds: [validCuid],
      };

      const result = updateCategorySchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("должен принимать пустой объект", () => {
      const validData = {};

      const result = updateCategorySchema.parse(validData);

      expect(result).toEqual({});
    });

    it("должен принимать только name", () => {
      const validData = {
        name: "Только название",
      };

      const result = updateCategorySchema.parse(validData);

      expect(result.name).toBe("Только название");
      expect(result.siteIds).toBeUndefined();
    });

    it("должен принимать только siteIds", () => {
      const validData = {
        siteIds: [validCuid],
      };

      const result = updateCategorySchema.parse(validData);

      expect(result.siteIds).toEqual([validCuid]);
      expect(result.name).toBeUndefined();
    });

    it("должен отклонять пустой массив siteIds", () => {
      const invalidData = {
        siteIds: [],
      };

      expect(() => updateCategorySchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});

