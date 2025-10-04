import { SocialAuthButton } from "@/shared/ui/SocialAuthButton";
import { SocialAuthButtons } from "@/shared/ui/SocialAuthButtons";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

import { signIn } from "next-auth/react";

describe("SocialAuthButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render button with correct text", () => {
    render(<SocialAuthButton provider="vk">Войти через VK</SocialAuthButton>);

    expect(screen.getByText("Войти через VK")).toBeInTheDocument();
  });

  it("should call signIn when clicked", async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue(undefined);

    render(
      <SocialAuthButton provider="vk" callbackUrl="/dashboard">
        Войти через VK
      </SocialAuthButton>
    );

    const button = screen.getByText("Войти через VK");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("vk", {
        callbackUrl: "/dashboard",
      });
    });
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <SocialAuthButton provider="vk" disabled>
        Войти через VK
      </SocialAuthButton>
    );

    const button = screen.getByText("Войти через VK");
    expect(button).toBeDisabled();
  });

  it("should show loading state when signing in", async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SocialAuthButton provider="vk">Войти через VK</SocialAuthButton>);

    const button = screen.getByText("Войти через VK");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Вход...")).toBeInTheDocument();
    });
  });
});

describe("SocialAuthButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all social providers", () => {
    render(<SocialAuthButtons />);

    expect(screen.getByText("Войти через Google")).toBeInTheDocument();
    expect(screen.getByText("Войти через GitHub")).toBeInTheDocument();
    expect(screen.getByText("Войти через VKontakte")).toBeInTheDocument();
    expect(screen.getByText("Войти через Одноклассники")).toBeInTheDocument();
    expect(screen.getByText("Войти через Mail.ru")).toBeInTheDocument();
    expect(screen.getByText("Войти через Yandex")).toBeInTheDocument();
  });

  it("should pass callbackUrl to all buttons", async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue(undefined);

    render(<SocialAuthButtons callbackUrl="/dashboard" />);

    const vkButton = screen.getByText("Войти через VKontakte");
    fireEvent.click(vkButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("vk", {
        callbackUrl: "/dashboard",
      });
    });
  });

  it("should disable all buttons when disabled prop is true", () => {
    render(<SocialAuthButtons disabled />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SocialAuthButtons className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
