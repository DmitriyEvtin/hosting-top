import { cn } from "../utils";

describe("Utils", () => {
  describe("cn function", () => {
    it("should merge class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", { conditional: true, hidden: false })).toBe(
        "base conditional"
      );
    });

    it("should handle undefined and null values", () => {
      expect(cn("base", undefined, null, "valid")).toBe("base valid");
    });

    it("should handle empty strings", () => {
      expect(cn("base", "", "valid")).toBe("base valid");
    });

    it("should handle arrays of classes", () => {
      expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
    });

    it("should handle Tailwind CSS conflicts", () => {
      // twMerge должен разрешать конфликты Tailwind классов
      expect(cn("p-2 p-4")).toBe("p-4");
      expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
    });

    it("should handle complex combinations", () => {
      expect(
        cn(
          "base-class",
          { "conditional-class": true, "hidden-class": false },
          ["array-class1", "array-class2"],
          undefined,
          null,
          "final-class"
        )
      ).toBe(
        "base-class conditional-class array-class1 array-class2 final-class"
      );
    });
  });
});
