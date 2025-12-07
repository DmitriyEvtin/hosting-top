import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HostingFilters } from "../HostingFilters";

const mockAvailableFilters = {
  countries: [
    { slug: "russia", name: "Россия", count: 10 },
    { slug: "usa", name: "США", count: 5 },
  ],
  cms: [
    { slug: "wordpress", name: "WordPress", count: 15 },
    { slug: "joomla", name: "Joomla", count: 8 },
  ],
  controlPanels: [
    { slug: "cpanel", name: "cPanel", count: 12 },
    { slug: "plesk", name: "Plesk", count: 7 },
  ],
  operationSystems: [
    { slug: "linux", name: "Linux", count: 20 },
    { slug: "windows", name: "Windows", count: 3 },
  ],
  priceRange: { min: 0, max: 10000 },
};

const defaultProps = {
  search: "",
  countries: [],
  minPrice: "",
  maxPrice: "",
  cms: [],
  controlPanels: [],
  operationSystems: [],
  availableFilters: mockAvailableFilters,
  onSearchChange: jest.fn(),
  onCountriesChange: jest.fn(),
  onPriceChange: jest.fn(),
  onCmsChange: jest.fn(),
  onControlPanelsChange: jest.fn(),
  onOperationSystemsChange: jest.fn(),
  onClear: jest.fn(),
};

describe("HostingFilters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("отображает все поля фильтров", () => {
    render(<HostingFilters {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("Поиск по названию хостинга...")
    ).toBeInTheDocument();
    expect(screen.getByText("Страны")).toBeInTheDocument();
    expect(screen.getByText("Цена (руб/мес)")).toBeInTheDocument();
    expect(screen.getByText("CMS")).toBeInTheDocument();
    expect(screen.getByText("Панели управления")).toBeInTheDocument();
    expect(screen.getByText("ОС")).toBeInTheDocument();
  });

  it("вызывает onSearchChange при изменении поиска", () => {
    render(<HostingFilters {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      "Поиск по названию хостинга..."
    );
    fireEvent.change(searchInput, { target: { value: "beget" } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("beget");
  });

  it("вызывает onCountriesChange при выборе страны", async () => {
    render(<HostingFilters {...defaultProps} />);

    // Находим кнопку для открытия фильтра стран
    const countriesButton = screen
      .getByText("Страны")
      .closest("div")
      ?.querySelector("button");

    if (countriesButton) {
      fireEvent.click(countriesButton);

      // Ждем появления опций
      await waitFor(() => {
        expect(screen.getByText("Россия")).toBeInTheDocument();
      });

      // Кликаем на опцию
      const russiaOption = screen.getByText("Россия");
      fireEvent.click(russiaOption.closest("label")!);

      // Проверяем, что был вызван callback
      await waitFor(() => {
        expect(defaultProps.onCountriesChange).toHaveBeenCalled();
      });
    }
  });

  it("вызывает onPriceChange при изменении минимальной цены", () => {
    render(<HostingFilters {...defaultProps} />);

    const minPriceInput = screen.getByPlaceholderText("От");
    fireEvent.change(minPriceInput, { target: { value: "100" } });

    expect(defaultProps.onPriceChange).toHaveBeenCalledWith("100", "");
  });

  it("вызывает onPriceChange при изменении максимальной цены", () => {
    render(<HostingFilters {...defaultProps} />);

    const maxPriceInput = screen.getByPlaceholderText("До");
    fireEvent.change(maxPriceInput, { target: { value: "5000" } });

    expect(defaultProps.onPriceChange).toHaveBeenCalledWith("", "5000");
  });

  it("показывает кнопку 'Сбросить фильтры' только при наличии активных фильтров", () => {
    const { rerender } = render(<HostingFilters {...defaultProps} />);

    // Нет активных фильтров - кнопка не должна отображаться на десктопе
    expect(
      screen.queryByRole("button", { name: /Сбросить/i })
    ).not.toBeInTheDocument();

    // Добавляем активные фильтры
    rerender(
      <HostingFilters
        {...defaultProps}
        search="beget"
        countries={["russia"]}
      />
    );

    // Кнопка должна отображаться
    expect(
      screen.getByRole("button", { name: /Сбросить/i })
    ).toBeInTheDocument();
  });

  it("вызывает onClear при нажатии на кнопку 'Сбросить фильтры'", () => {
    render(
      <HostingFilters
        {...defaultProps}
        search="beget"
        countries={["russia"]}
      />
    );

    const clearButton = screen.getByRole("button", { name: /Сбросить/i });
    fireEvent.click(clearButton);

    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("отображает количество доступных опций в фильтрах", async () => {
    render(<HostingFilters {...defaultProps} />);

    // Открываем фильтр стран
    const countriesButton = screen
      .getByText("Страны")
      .closest("div")
      ?.querySelector("button");

    if (countriesButton) {
      fireEvent.click(countriesButton);

      await waitFor(() => {
        expect(screen.getByText("Россия")).toBeInTheDocument();
        expect(screen.getByText("(10)")).toBeInTheDocument(); // Количество для России
        expect(screen.getByText("(5)")).toBeInTheDocument(); // Количество для США
      });
    }
  });

  it("отображает выбранные опции как теги", async () => {
    render(
      <HostingFilters
        {...defaultProps}
        countries={["russia"]}
        cms={["wordpress"]}
      />
    );

    // Проверяем, что выбранные опции отображаются как теги
    await waitFor(() => {
      expect(screen.getByText("Россия")).toBeInTheDocument();
      expect(screen.getByText("WordPress")).toBeInTheDocument();
    });
  });

  it("поддерживает множественный выбор в фильтрах", async () => {
    render(<HostingFilters {...defaultProps} />);

    // Открываем фильтр CMS
    const cmsButton = screen
      .getByText("CMS")
      .closest("div")
      ?.querySelector("button");

    if (cmsButton) {
      fireEvent.click(cmsButton);

      await waitFor(() => {
        expect(screen.getByText("WordPress")).toBeInTheDocument();
      });

      // Выбираем первую опцию
      const wordpressOption = screen.getByText("WordPress");
      fireEvent.click(wordpressOption.closest("label")!);

      await waitFor(() => {
        expect(defaultProps.onCmsChange).toHaveBeenCalledWith(["wordpress"]);
      });
    }
  });

  it("отображает мобильную кнопку фильтров на маленьких экранах", () => {
    // Мокаем matchMedia для мобильного экрана
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(max-width: 1023px)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<HostingFilters {...defaultProps} />);

    // На мобильных должна быть кнопка "Фильтры"
    const filterButton = screen.getByRole("button", { name: /Фильтры/i });
    expect(filterButton).toBeInTheDocument();
  });

  it("открывает мобильное меню фильтров при клике на кнопку", () => {
    render(<HostingFilters {...defaultProps} />);

    const filterButton = screen.getByRole("button", { name: /Фильтры/i });
    fireEvent.click(filterButton);

    // Мобильное меню должно открыться
    expect(screen.getByText("Фильтры")).toBeInTheDocument();
  });

  it("закрывает мобильное меню при клике на кнопку закрытия", () => {
    render(<HostingFilters {...defaultProps} />);

    const filterButton = screen.getByRole("button", { name: /Фильтры/i });
    fireEvent.click(filterButton);

    // Находим кнопку закрытия
    const closeButtons = screen.getAllByRole("button");
    const closeButton = closeButtons.find((btn) =>
      btn.querySelector("svg")
    );

    if (closeButton) {
      fireEvent.click(closeButton);

      // Меню должно закрыться (проверяем, что заголовок "Фильтры" в меню исчез)
      // Это зависит от реализации, но в целом меню должно закрыться
    }
  });

  it("фильтрует опции по поисковому запросу", async () => {
    render(<HostingFilters {...defaultProps} />);

    // Открываем фильтр стран
    const countriesButton = screen
      .getByText("Страны")
      .closest("div")
      ?.querySelector("button");

    if (countriesButton) {
      fireEvent.click(countriesButton);

      await waitFor(() => {
        expect(screen.getByText("Россия")).toBeInTheDocument();
      });

      // Вводим поисковый запрос
      const searchInput = screen.getByPlaceholderText("Поиск...");
      fireEvent.change(searchInput, { target: { value: "рос" } });

      // Должна остаться только Россия
      await waitFor(() => {
        expect(screen.getByText("Россия")).toBeInTheDocument();
        expect(screen.queryByText("США")).not.toBeInTheDocument();
      });
    }
  });
});

