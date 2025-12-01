/**
 * Product Validation Tests
 * Unit тесты для валидации схем Product
 */

import { createProductSchema, updateProductSchema } from "@/entities/product/model/validation";
import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";

describe("Product Validation", () => {
  const validCuid = "clx1234567890123456789012";
  const validCategoryCuid = "clx9876543210987654321098";

  describe("createProductSchema", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        name: "Товар",
        categoryId: validCategoryCuid,
        siteIds: [validCuid],
      };

      const result = createProductSchema.parse(validData);

      expect(result).toEqual(validData);
      expect(result.name).toBe("Товар");
      expect(result.categoryId).toBe(validCategoryCuid);
      expect(result.siteIds).toHaveLength(1);
    });

    it("должен валидировать данные без categoryId", () => {
      const validData = {
        name: "Товар без категории",
        siteIds: [validCuid],
      };

      const result = createProductSchema.parse(validData);

      expect(result.name).toBe("Товар без категории");
      expect(result.categoryId).toBeUndefined();
      expect(result.siteIds).toHaveLength(1);
    });

    it("должен валидировать данные с несколькими сайтами", () => {
      const validData = {
        name: "Товар",
        siteIds: [validCuid, "clx1111111111111111111111"],
      };

      const result = createProductSchema.parse(validData);

      expect(result.siteIds).toHaveLength(2);
    });

    it("должен отклонять пустое название", () => {
      const invalidData = {
        name: "",
        siteIds: [validCuid],
      };

      expect(() => createProductSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять название длиннее 200 символов", () => {
      const invalidData = {
        name: "a".repeat(201),
        siteIds: [validCuid],
      };

      expect(() => createProductSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять пустой массив siteIds", () => {
      const invalidData = {
        name: "Товар",
        siteIds: [],
      };

      expect(() => createProductSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять некорректный CUID в categoryId", () => {
      const invalidData = {
        name: "Товар",
        categoryId: "invalid-cuid",
        siteIds: [validCuid],
      };

      expect(() => createProductSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять некорректный CUID в siteIds", () => {
      const invalidData = {
        name: "Товар",
        siteIds: ["invalid-cuid"],
      };

      expect(() => createProductSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe("updateProductSchema", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        name: "Обновленный товар",
        categoryId: validCategoryCuid,
        siteIds: [validCuid],
      };

      const result = updateProductSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("должен принимать пустой объект", () => {
      const validData = {};

      const result = updateProductSchema.parse(validData);

      expect(result).toEqual({});
    });

    it("должен принимать только name", () => {
      const validData = {
        name: "Только название",
      };

      const result = updateProductSchema.parse(validData);

      expect(result.name).toBe("Только название");
      expect(result.categoryId).toBeUndefined();
      expect(result.siteIds).toBeUndefined();
    });

    it("должен принимать categoryId как null", () => {
      const validData = {
        categoryId: null,
      };

      const result = updateProductSchema.parse(validData);

      expect(result.categoryId).toBeNull();
    });

    it("должен принимать только siteIds", () => {
      const validData = {
        siteIds: [validCuid],
      };

      const result = updateProductSchema.parse(validData);

      expect(result.siteIds).toEqual([validCuid]);
      expect(result.name).toBeUndefined();
    });

    it("должен отклонять пустой массив siteIds", () => {
      const invalidData = {
        siteIds: [],
      };

      expect(() => updateProductSchema.parse(invalidData)).toThrow(ZodError);
    });

    it("должен отклонять некорректный CUID в categoryId", () => {
      const invalidData = {
        categoryId: "invalid-cuid",
      };

      expect(() => updateProductSchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});

