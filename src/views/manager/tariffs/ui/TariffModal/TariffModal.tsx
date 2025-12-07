"use client";

import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { useEffect, useState } from "react";
import { MultiSelect } from "../MultiSelect";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface Tariff {
  id: string;
  name: string;
  price: string;
  currency: string;
  period: "MONTH" | "YEAR";
  diskSpace: number | null;
  bandwidth: number | null;
  domainsCount: number | null;
  databasesCount: number | null;
  emailAccounts: number | null;
  isActive: boolean;
  cms: ReferenceItem[];
  controlPanels: ReferenceItem[];
  countries: ReferenceItem[];
  dataStores: ReferenceItem[];
  operationSystems: ReferenceItem[];
  programmingLanguages: ReferenceItem[];
}

interface TariffModalProps {
  open: boolean;
  mode: "create" | "edit";
  tariff: Tariff | null;
  hostingId: string;
  onClose: () => void;
  onSave: () => void;
}

interface ReferenceData {
  cms: ReferenceItem[];
  controlPanels: ReferenceItem[];
  countries: ReferenceItem[];
  dataStores: ReferenceItem[];
  operationSystems: ReferenceItem[];
  programmingLanguages: ReferenceItem[];
}

export function TariffModal({
  open,
  mode,
  tariff,
  hostingId,
  onClose,
  onSave,
}: TariffModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);

  // Форма
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [period, setPeriod] = useState<"MONTH" | "YEAR">("MONTH");
  const [diskSpace, setDiskSpace] = useState<string>("");
  const [bandwidth, setBandwidth] = useState<string>("");
  const [domainsCount, setDomainsCount] = useState<string>("");
  const [databasesCount, setDatabasesCount] = useState<string>("");
  const [emailAccounts, setEmailAccounts] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Справочники
  const [references, setReferences] = useState<ReferenceData>({
    cms: [],
    controlPanels: [],
    countries: [],
    dataStores: [],
    operationSystems: [],
    programmingLanguages: [],
  });

  // Выбранные справочники
  const [selectedCms, setSelectedCms] = useState<string[]>([]);
  const [selectedControlPanels, setSelectedControlPanels] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDataStores, setSelectedDataStores] = useState<string[]>([]);
  const [selectedOperationSystems, setSelectedOperationSystems] = useState<string[]>([]);
  const [selectedProgrammingLanguages, setSelectedProgrammingLanguages] = useState<string[]>([]);

  // Загрузка справочников
  const fetchReferences = async () => {
    setLoadingReferences(true);
    try {
      const [cmsRes, controlPanelsRes, countriesRes, dataStoresRes, operationSystemsRes, programmingLanguagesRes] =
        await Promise.all([
          fetch("/api/manager/cms?limit=1000"),
          fetch("/api/manager/control-panels?limit=1000"),
          fetch("/api/manager/countries?limit=1000"),
          fetch("/api/manager/data-stores?limit=1000"),
          fetch("/api/manager/operation-systems?limit=1000"),
          fetch("/api/manager/programming-languages?limit=1000"),
        ]);

      const [cmsData, controlPanelsData, countriesData, dataStoresData, operationSystemsData, programmingLanguagesData] =
        await Promise.all([
          cmsRes.json(),
          controlPanelsRes.json(),
          countriesRes.json(),
          dataStoresRes.json(),
          operationSystemsRes.json(),
          programmingLanguagesRes.json(),
        ]);

      setReferences({
        cms: cmsData.cms || [],
        controlPanels: controlPanelsData.controlPanels || [],
        countries: countriesData.countries || [],
        dataStores: dataStoresData.dataStores || [],
        operationSystems: operationSystemsData.operationSystems || [],
        programmingLanguages: programmingLanguagesData.programmingLanguages || [],
      });
    } catch (error) {
      console.error("Ошибка загрузки справочников:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить справочники",
        variant: "destructive",
      });
    } finally {
      setLoadingReferences(false);
    }
  };

  // Загрузка данных тарифа для редактирования
  const fetchTariff = async (tariffId: string) => {
    try {
      const response = await fetch(`/api/manager/tariffs/${tariffId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки тарифа");
      }

      const tariffData = data.tariff;
      setName(tariffData.name || "");
      setPrice(tariffData.price?.toString() || "");
      setCurrency(tariffData.currency || "RUB");
      setPeriod(tariffData.period || "MONTH");
      setDiskSpace(tariffData.diskSpace?.toString() || "");
      setBandwidth(tariffData.bandwidth?.toString() || "");
      setDomainsCount(tariffData.domainsCount?.toString() || "");
      setDatabasesCount(tariffData.databasesCount?.toString() || "");
      setEmailAccounts(tariffData.emailAccounts?.toString() || "");
      setIsActive(tariffData.isActive ?? true);

      // Устанавливаем выбранные справочники
      setSelectedCms(tariffData.cms?.map((c: ReferenceItem) => c.id) || []);
      setSelectedControlPanels(tariffData.controlPanels?.map((c: ReferenceItem) => c.id) || []);
      setSelectedCountries(tariffData.countries?.map((c: ReferenceItem) => c.id) || []);
      setSelectedDataStores(tariffData.dataStores?.map((c: ReferenceItem) => c.id) || []);
      setSelectedOperationSystems(tariffData.operationSystems?.map((c: ReferenceItem) => c.id) || []);
      setSelectedProgrammingLanguages(tariffData.programmingLanguages?.map((c: ReferenceItem) => c.id) || []);
    } catch (error) {
      console.error("Ошибка загрузки тарифа:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные тарифа",
        variant: "destructive",
      });
    }
  };

  // Сброс формы
  const resetForm = () => {
    setName("");
    setPrice("");
    setCurrency("RUB");
    setPeriod("MONTH");
    setDiskSpace("");
    setBandwidth("");
    setDomainsCount("");
    setDatabasesCount("");
    setEmailAccounts("");
    setIsActive(true);
    setSelectedCms([]);
    setSelectedControlPanels([]);
    setSelectedCountries([]);
    setSelectedDataStores([]);
    setSelectedOperationSystems([]);
    setSelectedProgrammingLanguages([]);
  };

  // Загрузка данных при открытии модального окна
  useEffect(() => {
    if (open) {
      fetchReferences();
      if (mode === "edit" && tariff) {
        fetchTariff(tariff.id);
      } else {
        resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, tariff]);

  // Обработка сохранения
  const handleSave = async () => {
    // Валидация
    if (!name.trim()) {
      toast({
        title: "Ошибка валидации",
        description: "Название обязательно",
        variant: "destructive",
      });
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Цена должна быть положительной",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        price: parseFloat(price),
        currency,
        period,
        disk_space: diskSpace ? parseInt(diskSpace) : null,
        bandwidth: bandwidth ? parseInt(bandwidth) : null,
        domains_count: domainsCount ? parseInt(domainsCount) : null,
        databases_count: databasesCount ? parseInt(databasesCount) : null,
        email_accounts: emailAccounts ? parseInt(emailAccounts) : null,
        is_active: isActive,
        cms_ids: selectedCms,
        control_panel_ids: selectedControlPanels,
        country_ids: selectedCountries,
        data_store_ids: selectedDataStores,
        operation_system_ids: selectedOperationSystems,
        programming_language_ids: selectedProgrammingLanguages,
      };

      let response;
      if (mode === "create") {
        response = await fetch(`/api/manager/hostings/${hostingId}/tariffs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/manager/tariffs/${tariff?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка сохранения тарифа");
      }

      toast({
        title: mode === "create" ? "Тариф создан" : "Тариф обновлен",
        description: `Тариф "${name}" успешно ${mode === "create" ? "создан" : "обновлен"}`,
        variant: "success",
      });

      onSave();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка сохранения тарифа";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Создать тариф" : "Редактировать тариф"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Заполните форму для создания нового тарифа"
              : "Измените данные тарифа"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Название <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Название тарифа"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">
                  Цена <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">
                  Период <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={period}
                  onValueChange={(value) => setPeriod(value as "MONTH" | "YEAR")}
                >
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTH">Месяц</SelectItem>
                    <SelectItem value="YEAR">Год</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Активен
                </Label>
              </div>
            </div>
          </div>

          {/* Технические характеристики */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Технические характеристики</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diskSpace">Место на диске (ГБ)</Label>
                <Input
                  id="diskSpace"
                  type="number"
                  min="0"
                  value={diskSpace}
                  onChange={(e) => setDiskSpace(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bandwidth">Трафик (ГБ)</Label>
                <Input
                  id="bandwidth"
                  type="number"
                  min="0"
                  value={bandwidth}
                  onChange={(e) => setBandwidth(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domainsCount">Количество доменов</Label>
                <Input
                  id="domainsCount"
                  type="number"
                  min="0"
                  value={domainsCount}
                  onChange={(e) => setDomainsCount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="databasesCount">Количество БД</Label>
                <Input
                  id="databasesCount"
                  type="number"
                  min="0"
                  value={databasesCount}
                  onChange={(e) => setDatabasesCount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailAccounts">Email аккаунтов</Label>
                <Input
                  id="emailAccounts"
                  type="number"
                  min="0"
                  value={emailAccounts}
                  onChange={(e) => setEmailAccounts(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Поддерживаемые технологии */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Поддерживаемые технологии</h3>
            <div className="grid grid-cols-2 gap-4">
              <MultiSelect
                label="CMS"
                options={references.cms}
                value={selectedCms}
                onChange={setSelectedCms}
                placeholder="Выберите CMS"
              />
              <MultiSelect
                label="Панели управления"
                options={references.controlPanels}
                value={selectedControlPanels}
                onChange={setSelectedControlPanels}
                placeholder="Выберите панели управления"
              />
              <MultiSelect
                label="Страны"
                options={references.countries}
                value={selectedCountries}
                onChange={setSelectedCountries}
                placeholder="Выберите страны"
              />
              <MultiSelect
                label="Типы хранилищ"
                options={references.dataStores}
                value={selectedDataStores}
                onChange={setSelectedDataStores}
                placeholder="Выберите типы хранилищ"
              />
              <MultiSelect
                label="ОС"
                options={references.operationSystems}
                value={selectedOperationSystems}
                onChange={setSelectedOperationSystems}
                placeholder="Выберите ОС"
              />
              <MultiSelect
                label="Языки программирования"
                options={references.programmingLanguages}
                value={selectedProgrammingLanguages}
                onChange={setSelectedProgrammingLanguages}
                placeholder="Выберите языки программирования"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={loading || loadingReferences}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

