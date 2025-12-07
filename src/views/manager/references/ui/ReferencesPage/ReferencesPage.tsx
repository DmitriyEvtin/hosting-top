"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/Tabs";
import { ReferenceSection } from "../ReferenceSection";

export function ReferencesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Управление справочниками</h1>
        <p className="text-muted-foreground mt-2">
          Управление всеми справочниками системы
        </p>
      </div>

      <Tabs defaultValue="cms" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="cms">CMS</TabsTrigger>
          <TabsTrigger value="control-panels">Панели управления</TabsTrigger>
          <TabsTrigger value="countries">Страны</TabsTrigger>
          <TabsTrigger value="data-stores">Хранилища</TabsTrigger>
          <TabsTrigger value="operation-systems">ОС</TabsTrigger>
          <TabsTrigger value="programming-languages">Языки</TabsTrigger>
        </TabsList>

        <TabsContent value="cms" className="mt-6">
          <ReferenceSection
            type="cms"
            title="CMS"
            apiEndpoint="/api/manager/cms"
            responseKey="cms"
          />
        </TabsContent>

        <TabsContent value="control-panels" className="mt-6">
          <ReferenceSection
            type="control-panels"
            title="Панели управления"
            apiEndpoint="/api/manager/control-panels"
            responseKey="controlPanels"
          />
        </TabsContent>

        <TabsContent value="countries" className="mt-6">
          <ReferenceSection
            type="countries"
            title="Страны"
            apiEndpoint="/api/manager/countries"
            responseKey="countries"
          />
        </TabsContent>

        <TabsContent value="data-stores" className="mt-6">
          <ReferenceSection
            type="data-stores"
            title="Хранилища данных"
            apiEndpoint="/api/manager/data-stores"
            responseKey="dataStores"
          />
        </TabsContent>

        <TabsContent value="operation-systems" className="mt-6">
          <ReferenceSection
            type="operation-systems"
            title="Операционные системы"
            apiEndpoint="/api/manager/operation-systems"
            responseKey="operationSystems"
          />
        </TabsContent>

        <TabsContent value="programming-languages" className="mt-6">
          <ReferenceSection
            type="programming-languages"
            title="Языки программирования"
            apiEndpoint="/api/manager/programming-languages"
            responseKey="programmingLanguages"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

