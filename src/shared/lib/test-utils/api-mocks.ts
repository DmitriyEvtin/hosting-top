import { http, HttpResponse } from "msw";
import {
  createMockCategory,
  createMockProduct,
  createMockUser,
} from "./data-factories";

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

  // Products endpoints
  http.get(`${API_BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const products = Array.from({ length: limit }, () => createMockProduct());

    return HttpResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: 100,
        totalPages: 10,
      },
    });
  }),

  http.get(`${API_BASE}/products/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(createMockProduct({ id }));
  }),

  http.post(`${API_BASE}/products`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(createMockProduct(body), { status: 201 });
  }),

  http.put(`${API_BASE}/products/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    return HttpResponse.json(createMockProduct({ id, ...body }));
  }),

  http.delete(`${API_BASE}/products/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id, deleted: true });
  }),

  // Categories endpoints
  http.get(`${API_BASE}/categories`, () => {
    const categories = Array.from({ length: 5 }, () => createMockCategory());
    return HttpResponse.json({ data: categories });
  }),

  http.get(`${API_BASE}/categories/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(createMockCategory({ id }));
  }),

  // Search endpoints
  http.get(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return HttpResponse.json({ data: [], total: 0 });
    }

    const products = Array.from({ length: 5 }, () =>
      createMockProduct({ name: `${query} ${Math.random()}` })
    );

    return HttpResponse.json({
      data: products,
      total: products.length,
      query,
    });
  }),

  // Admin endpoints
  http.get(`${API_BASE}/admin/stats`, () => {
    return HttpResponse.json({
      totalProducts: 1000,
      totalCategories: 50,
      totalUsers: 25,
      parsingStatus: "IDLE",
    });
  }),

  http.post(`${API_BASE}/admin/parsing/start`, () => {
    return HttpResponse.json({
      sessionId: "mock-session-id",
      status: "STARTED",
    });
  }),

  http.get(`${API_BASE}/admin/parsing/status/:sessionId`, ({ params }) => {
    const { sessionId } = params;
    return HttpResponse.json({
      sessionId,
      status: "RUNNING",
      progress: 45,
      processed: 450,
      total: 1000,
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
