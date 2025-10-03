import { UserRole } from "../../src/shared/lib/types";

describe("Admin Protection Logic", () => {
  it("should correctly identify admin role", () => {
    expect(UserRole.ADMIN).toBe("ADMIN");
  });

  it("should correctly identify user role", () => {
    expect(UserRole.USER).toBe("USER");
  });

  it("should correctly identify moderator role", () => {
    expect(UserRole.MODERATOR).toBe("MODERATOR");
  });
});
