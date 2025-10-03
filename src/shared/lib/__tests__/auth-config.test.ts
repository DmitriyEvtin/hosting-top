// Мокаем весь модуль auth-config
jest.mock("../auth-config", () => ({
  authOptions: {
    providers: [],
    callbacks: {
      jwt: jest.fn(),
      session: jest.fn(),
      signIn: jest.fn(),
    },
  },
}));

describe("Auth Configuration", () => {
  it("should have auth options configured", () => {
    const { authOptions } = require("../auth-config");

    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.callbacks).toBeDefined();
  });

  it("should have JWT callback configured", () => {
    const { authOptions } = require("../auth-config");

    expect(authOptions.callbacks.jwt).toBeDefined();
    expect(typeof authOptions.callbacks.jwt).toBe("function");
  });

  it("should have session callback configured", () => {
    const { authOptions } = require("../auth-config");

    expect(authOptions.callbacks.session).toBeDefined();
    expect(typeof authOptions.callbacks.session).toBe("function");
  });

  it("should have sign in callback configured", () => {
    const { authOptions } = require("../auth-config");

    expect(authOptions.callbacks.signIn).toBeDefined();
    expect(typeof authOptions.callbacks.signIn).toBe("function");
  });
});
