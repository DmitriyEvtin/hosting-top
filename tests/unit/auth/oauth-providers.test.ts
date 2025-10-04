import MailProvider from "@/shared/lib/auth-providers/mail-provider";
import OKProvider from "@/shared/lib/auth-providers/ok-provider";
import VKProvider from "@/shared/lib/auth-providers/vk-provider";
import YandexProvider from "@/shared/lib/auth-providers/yandex-provider";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock fetch
global.fetch = vi.fn();

describe("OAuth Providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("VK Provider", () => {
    it("should create VK provider with correct configuration", () => {
      const provider = VKProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      expect(provider.id).toBe("vk");
      expect(provider.name).toBe("VKontakte");
      expect(provider.type).toBe("oauth");
      expect(provider.authorization?.url).toBe(
        "https://oauth.vk.com/authorize"
      );
      expect(provider.token).toBe("https://oauth.vk.com/access_token");
    });

    it("should handle VK profile correctly", () => {
      const provider = VKProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      const mockProfile = {
        id: "123456",
        first_name: "Иван",
        last_name: "Петров",
        photo_200: "https://example.com/photo.jpg",
        email: "ivan@example.com",
      };

      const result = provider.profile(mockProfile);

      expect(result).toEqual({
        id: "123456",
        name: "Иван Петров",
        email: "ivan@example.com",
        image: "https://example.com/photo.jpg",
        role: "USER",
      });
    });
  });

  describe("OK Provider", () => {
    it("should create OK provider with correct configuration", () => {
      const provider = OKProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      expect(provider.id).toBe("ok");
      expect(provider.name).toBe("Одноклассники");
      expect(provider.type).toBe("oauth");
      expect(provider.authorization?.url).toBe(
        "https://connect.ok.ru/oauth/authorize"
      );
      expect(provider.token).toBe("https://api.ok.ru/oauth/token.do");
    });

    it("should handle OK profile correctly", () => {
      const provider = OKProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      const mockProfile = {
        uid: "123456",
        first_name: "Иван",
        last_name: "Петров",
        pic_2: "https://example.com/photo.jpg",
        email: "ivan@example.com",
      };

      const result = provider.profile(mockProfile);

      expect(result).toEqual({
        id: "123456",
        name: "Иван Петров",
        email: "ivan@example.com",
        image: "https://example.com/photo.jpg",
        role: "USER",
      });
    });
  });

  describe("Mail Provider", () => {
    it("should create Mail provider with correct configuration", () => {
      const provider = MailProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      expect(provider.id).toBe("mail");
      expect(provider.name).toBe("Mail.ru");
      expect(provider.type).toBe("oauth");
      expect(provider.authorization?.url).toBe("https://oauth.mail.ru/login");
      expect(provider.token).toBe("https://oauth.mail.ru/token");
    });

    it("should handle Mail profile correctly", () => {
      const provider = MailProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      const mockProfile = {
        id: "123456",
        name: "Иван Петров",
        email: "ivan@example.com",
        picture: "https://example.com/photo.jpg",
      };

      const result = provider.profile(mockProfile);

      expect(result).toEqual({
        id: "123456",
        name: "Иван Петров",
        email: "ivan@example.com",
        image: "https://example.com/photo.jpg",
        role: "USER",
      });
    });
  });

  describe("Yandex Provider", () => {
    it("should create Yandex provider with correct configuration", () => {
      const provider = YandexProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      expect(provider.id).toBe("yandex");
      expect(provider.name).toBe("Yandex");
      expect(provider.type).toBe("oauth");
      expect(provider.authorization?.url).toBe(
        "https://oauth.yandex.ru/authorize"
      );
      expect(provider.token).toBe("https://oauth.yandex.ru/token");
    });

    it("should handle Yandex profile with display_name", () => {
      const provider = YandexProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      const mockProfile = {
        id: "123456",
        login: "ivan.petrov",
        display_name: "Иван Петров",
        real_name: "Иван Петров",
        first_name: "Иван",
        last_name: "Петров",
        default_avatar_id: "avatar123",
        is_avatar_empty: false,
        default_email: "ivan@yandex.ru",
      };

      const result = provider.profile(mockProfile);

      expect(result).toEqual({
        id: "123456",
        name: "Иван Петров",
        email: "ivan@yandex.ru",
        image: "https://avatars.yandex.net/get-yapic/avatar123/islands-200",
        role: "USER",
      });
    });

    it("should handle Yandex profile without display_name", () => {
      const provider = YandexProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      const mockProfile = {
        id: "123456",
        login: "ivan.petrov",
        display_name: undefined,
        real_name: "Иван Петров",
        first_name: "Иван",
        last_name: "Петров",
        default_avatar_id: "avatar123",
        is_avatar_empty: false,
        default_email: "ivan@yandex.ru",
      };

      const result = provider.profile(mockProfile);

      expect(result).toEqual({
        id: "123456",
        name: "Иван Петров",
        email: "ivan@yandex.ru",
        image: "https://avatars.yandex.net/get-yapic/avatar123/islands-200",
        role: "USER",
      });
    });

    it("should handle Yandex profile with empty avatar", () => {
      const provider = YandexProvider({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      const mockProfile = {
        id: "123456",
        login: "ivan.petrov",
        display_name: undefined,
        real_name: undefined,
        first_name: undefined,
        last_name: undefined,
        default_avatar_id: "avatar123",
        is_avatar_empty: true,
        default_email: "ivan@yandex.ru",
      };

      const result = provider.profile(mockProfile);

      expect(result).toEqual({
        id: "123456",
        name: "ivan.petrov",
        email: "ivan@yandex.ru",
        image: undefined,
        role: "USER",
      });
    });
  });
});
