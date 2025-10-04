"use client";

import { SocialAuthButton } from "@/shared/ui/SocialAuthButton";

interface SocialAuthButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
  className?: string;
}

export function SocialAuthButtons({
  callbackUrl = "/",
  disabled = false,
  className = "",
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
        >
          <span className="mr-2">{provider.icon}</span>
          Войти через {provider.name}
        </SocialAuthButton>
      ))}
    </div>
  );
}
