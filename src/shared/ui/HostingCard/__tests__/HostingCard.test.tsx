import { render, screen, fireEvent } from "@testing-library/react";
import { HostingCard } from "../HostingCard";
import { useRouter } from "next/navigation";

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, fill, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={src} alt={alt} data-fill={fill ? "true" : undefined} {...props} />;
  },
}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("HostingCard", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.clearAllMocks();
  });

  const mockHosting = {
    id: "1",
    name: "Beget",
    slug: "beget",
    description: "Это описание хостинга Beget с подробной информацией о предоставляемых услугах и преимуществах.",
    logoUrl: "https://example.com/logo.png",
    websiteUrl: "https://beget.com",
    startYear: "2007",
    clients: 50000,
    testPeriod: 30,
    _count: { tariffs: 5 },
  };

  it("отображает все данные хостинга", () => {
    render(<HostingCard hosting={mockHosting} />);

    expect(screen.getByText("Beget")).toBeInTheDocument();
    expect(screen.getByText(/Это описание хостинга Beget/)).toBeInTheDocument();
    expect(screen.getByText("Основан в 2007")).toBeInTheDocument();
    expect(screen.getByText(/50 000 клиентов/)).toBeInTheDocument();
    expect(screen.getByText("30 дн. тест")).toBeInTheDocument();
    expect(screen.getByText(/5 тарифов/)).toBeInTheDocument();
  });

  it("отображает логотип хостинга", () => {
    render(<HostingCard hosting={mockHosting} />);

    const logo = screen.getByAltText("Beget");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("отображает fallback для отсутствующего логотипа", () => {
    const hostingWithoutLogo = {
      ...mockHosting,
      logoUrl: null,
    };

    render(<HostingCard hosting={hostingWithoutLogo} />);

    expect(screen.getByText("Нет логотипа")).toBeInTheDocument();
  });

  it("отображает ссылку на сайт хостинга", () => {
    render(<HostingCard hosting={mockHosting} />);

    const websiteLink = screen.getByText("beget.com");
    expect(websiteLink).toBeInTheDocument();
    expect(websiteLink.closest("a")).toHaveAttribute("href", "https://beget.com");
  });

  it("не отображает ссылку на сайт, если websiteUrl отсутствует", () => {
    const hostingWithoutWebsite = {
      ...mockHosting,
      websiteUrl: null,
    };

    render(<HostingCard hosting={hostingWithoutWebsite} />);

    expect(screen.queryByText("beget.com")).not.toBeInTheDocument();
  });

  it("обрезает длинное описание до 150 символов", () => {
    const hostingWithLongDescription = {
      ...mockHosting,
      description: "A".repeat(200),
    };

    render(<HostingCard hosting={hostingWithLongDescription} />);

    const description = screen.getByText(/^A{150}\.\.\.$/);
    expect(description).toBeInTheDocument();
  });

  it("не отображает описание, если оно отсутствует", () => {
    const hostingWithoutDescription = {
      ...mockHosting,
      description: null,
    };

    render(<HostingCard hosting={hostingWithoutDescription} />);

    expect(screen.queryByText(/Это описание/)).not.toBeInTheDocument();
  });

  it("не отображает год основания, если startYear отсутствует", () => {
    const hostingWithoutYear = {
      ...mockHosting,
      startYear: null,
    };

    render(<HostingCard hosting={hostingWithoutYear} />);

    expect(screen.queryByText("Основан в")).not.toBeInTheDocument();
  });

  it("не отображает количество клиентов, если clients равен null", () => {
    const hostingWithoutClients = {
      ...mockHosting,
      clients: null,
    };

    render(<HostingCard hosting={hostingWithoutClients} />);

    expect(screen.queryByText(/клиентов/)).not.toBeInTheDocument();
  });

  it("не отображает тестовый период, если testPeriod равен 0", () => {
    const hostingWithoutTestPeriod = {
      ...mockHosting,
      testPeriod: 0,
    };

    render(<HostingCard hosting={hostingWithoutTestPeriod} />);

    expect(screen.queryByText(/дн\. тест/)).not.toBeInTheDocument();
  });

  it("кликабелен и ведет на правильный URL", () => {
    render(<HostingCard hosting={mockHosting} />);

    const card = screen.getByText("Beget").closest(".rounded-lg");
    expect(card).toBeInTheDocument();

    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith("/hosting/beget");
  });

  it("правильно склоняет слово 'тариф'", () => {
    const hostingWithOneTariff = {
      ...mockHosting,
      _count: { tariffs: 1 },
    };

    const { rerender } = render(<HostingCard hosting={hostingWithOneTariff} />);
    expect(screen.getByText(/1 тариф$/)).toBeInTheDocument();

    const hostingWithTwoTariffs = {
      ...mockHosting,
      _count: { tariffs: 2 },
    };
    rerender(<HostingCard hosting={hostingWithTwoTariffs} />);
    expect(screen.getByText(/2 тарифа$/)).toBeInTheDocument();

    const hostingWithFiveTariffs = {
      ...mockHosting,
      _count: { tariffs: 5 },
    };
    rerender(<HostingCard hosting={hostingWithFiveTariffs} />);
    expect(screen.getByText(/5 тарифов$/)).toBeInTheDocument();
  });

  it("применяет кастомный className", () => {
    const { container } = render(
      <HostingCard hosting={mockHosting} className="custom-class" />
    );

    const card = container.querySelector(".custom-class");
    expect(card).toBeInTheDocument();
  });

  it("форматирует большое количество клиентов с разделителями", () => {
    const hostingWithManyClients = {
      ...mockHosting,
      clients: 1234567,
    };

    render(<HostingCard hosting={hostingWithManyClients} />);

    expect(screen.getByText(/1 234 567 клиентов/)).toBeInTheDocument();
  });
});

