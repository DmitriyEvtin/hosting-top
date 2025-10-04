"use client";

import { SocialAuthButton } from "@/shared/ui/SocialAuthButton";

interface SocialAuthButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
  className?: string;
  actionType?: "login" | "register";
}

export function SocialAuthButtons({
  callbackUrl = "/",
  disabled = false,
  className = "",
  actionType = "login",
}: SocialAuthButtonsProps) {
  const socialProviders = [
    {
      id: "google",
      name: "Google",
      icon: "🔍",
    },
    {
      id: "github",
      name: "GitHub",
      icon: "🐙",
    },
    {
      id: "vk",
      name: "VKontakte",
      icon: "🔵",
    },
    {
      id: "ok",
      name: "Одноклассники",
      icon: "🟠",
    },
    {
      id: "mail",
      name: "Mail.ru",
      icon: "📧",
    },
    {
      id: "yandex",
      name: "Yandex",
      icon: "🔴",
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {socialProviders.map(provider => (
        <SocialAuthButton
          key={provider.id}
          provider={provider.id}
          callbackUrl={callbackUrl}
          disabled={disabled}
          className="w-full justify-start"
          actionType={actionType}
        >
          <span className="mr-2">{provider.icon}</span>
          {actionType === "register"
            ? "Зарегистрироваться через"
            : "Войти через"}{" "}
          {provider.name}
        </SocialAuthButton>
      ))}
    </div>
  );
}
