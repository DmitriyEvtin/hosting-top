import { faker } from "@faker-js/faker";

// User factory
export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: "USER",
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Create arrays of mock data
export const createMockUsers = (count: number) =>
  Array.from({ length: count }, () => createMockUser());

// Mock API responses
export const createMockApiResponse = <T>(data: T, overrides = {}) => ({
  data,
  success: true,
  message: "Success",
  ...overrides,
});

export const createMockApiError = (message: string, status = 400) => ({
  data: null,
  success: false,
  message,
  status,
});
