import { authOptions } from "@/shared/lib/auth-config";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/shared/api/database", () => ({
  prisma: mockPrisma,
}));

describe("OAuth Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn callback", () => {
    it("should create new user for OAuth providers", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      const mockAccount = {
        provider: "vk",
        type: "oauth",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@example.com" },
        });
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            email: "test@example.com",
            name: "Test User",
            image: "https://example.com/avatar.jpg",
            role: "USER",
          },
        });
      }
    });

    it("should not create user if already exists", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      const mockAccount = {
        provider: "vk",
        type: "oauth",
      };

      const existingUser = {
        id: "existing123",
        email: "test@example.com",
        name: "Existing User",
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@example.com" },
        });
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      }
    });

    it("should handle credentials provider", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      };

      const mockAccount = {
        provider: "credentials",
        type: "credentials",
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      }
    });
  });

  describe("JWT callback", () => {
    it("should add role and id to token", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      };

      const mockToken = {};

      const jwtCallback = authOptions.callbacks?.jwt;
      if (jwtCallback) {
        const result = await jwtCallback({
          token: mockToken,
          user: mockUser,
        });

        expect(result).toEqual({
          role: "USER",
          id: "user123",
        });
      }
    });

    it("should preserve existing token data", async () => {
      const mockToken = {
        existingData: "value",
        role: "ADMIN",
      };

      const jwtCallback = authOptions.callbacks?.jwt;
      if (jwtCallback) {
        const result = await jwtCallback({
          token: mockToken,
          user: undefined,
        });

        expect(result).toEqual(mockToken);
      }
    });
  });

  describe("Session callback", () => {
    it("should add role and id to session", async () => {
      const mockSession = {
        user: {
          email: "test@example.com",
          name: "Test User",
        },
      };

      const mockToken = {
        role: "USER",
        id: "user123",
      };

      const sessionCallback = authOptions.callbacks?.session;
      if (sessionCallback) {
        const result = await sessionCallback({
          session: mockSession,
          token: mockToken,
        });

        expect(result).toEqual({
          user: {
            email: "test@example.com",
            name: "Test User",
            id: "user123",
            role: "USER",
          },
        });
      }
    });
  });
});
