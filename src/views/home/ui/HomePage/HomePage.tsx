import Link from "next/link";
import { Button } from "@/shared/ui/Button";

export function Homepage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-6">
          Добро пожаловать в Hosting Top
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Современная платформа для подбора хостинга и сервера
        </p>
      </div>
    </div>
  );
}
