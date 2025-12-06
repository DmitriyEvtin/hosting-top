import { handlers } from "@/shared/lib/test-utils/api-mocks";
import { setupServer } from "msw/node";

// Setup MSW server
const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("API Integration Tests", () => {
  describe("Admin API", () => {
    it("should fetch admin stats", async () => {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalUsers).toBeDefined();
      expect(data.parsingStatus).toBeDefined();
    });

    it("should start parsing session", async () => {
      const response = await fetch("/api/admin/parsing/start", {
        method: "POST",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBeDefined();
      expect(data.status).toBe("STARTED");
    });

    it("should get parsing status", async () => {
      const sessionId = "mock-session-id";
      const response = await fetch(`/api/admin/parsing/status/${sessionId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe(sessionId);
      expect(data.status).toBe("RUNNING");
      expect(data.progress).toBeDefined();
      expect(data.processed).toBeDefined();
      expect(data.total).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle 500 errors", async () => {
      const response = await fetch("/api/error");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle 404 errors", async () => {
      const response = await fetch("/api/not-found");
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });
  });
});
