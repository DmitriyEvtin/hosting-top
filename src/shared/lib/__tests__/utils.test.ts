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
  });
});
