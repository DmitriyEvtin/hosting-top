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

// Product factory
export const createMockProduct = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price()),
  categoryId: faker.string.uuid(),
  images: [faker.image.url()],
  specifications: {
    material: faker.commerce.productMaterial(),
    dimensions: `${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })}`,
    weight: faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 }),
  },
  isActive: true,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Category factory
export const createMockCategory = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.department(),
  description: faker.lorem.sentence(),
  parentId: null,
  slug: faker.helpers.slugify(faker.commerce.department()),
  isActive: true,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// ProductImage factory
export const createMockProductImage = (overrides = {}) => ({
  id: faker.string.uuid(),
  productId: faker.string.uuid(),
  url: faker.image.url(),
  alt: faker.lorem.words(3),
  isPrimary: false,
  order: faker.number.int({ min: 0, max: 10 }),
  createdAt: faker.date.past(),
  ...overrides,
});

// ParsingSession factory
export const createMockParsingSession = (overrides = {}) => ({
  id: faker.string.uuid(),
  status: "RUNNING",
  startedAt: faker.date.past(),
  finishedAt: null,
  totalProducts: faker.number.int({ min: 100, max: 1000 }),
  processedProducts: faker.number.int({ min: 0, max: 100 }),
  errors: [],
  createdAt: faker.date.past(),
  ...overrides,
});

// Create arrays of mock data
export const createMockUsers = (count: number) =>
  Array.from({ length: count }, () => createMockUser());

export const createMockProducts = (count: number) =>
  Array.from({ length: count }, () => createMockProduct());

export const createMockCategories = (count: number) =>
  Array.from({ length: count }, () => createMockCategory());

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
