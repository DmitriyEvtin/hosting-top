import { http, HttpResponse } from "msw";
import { createMockUser } from "./data-factories";

// API base URL
const API_BASE = "/api";

// Mock handlers for MSW
export const handlers = [
  // Auth endpoints
  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json(createMockUser());
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "test@example.com" && body.password === "password") {
      return HttpResponse.json({
        user: createMockUser({ email: body.email }),
        token: "mock-jwt-token",
      });
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // Admin endpoints
  http.get(`${API_BASE}/admin/stats`, () => {
    return HttpResponse.json({
      totalUsers: 25,
    });
  }),

  // Error handlers
  http.get(`${API_BASE}/error`, () => {
    return HttpResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE}/not-found`, () => {
    return HttpResponse.json({ error: "Not found" }, { status: 404 });
  }),
];

// Mock server setup for tests
export const setupMockServer = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setupServer } = require("msw/node");
  return setupServer(...handlers);
};

// Mock server setup for browser tests
export const setupMockServerBrowser = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setupWorker } = require("msw/browser");
  return setupWorker(...handlers);
};
