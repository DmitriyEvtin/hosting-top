"use client";

import { SocialAuthButton } from "@/shared/ui/SocialAuthButton";
import {
  GitHubIcon,
  GoogleIcon,
  MailIcon,
  OKIcon,
  VKIcon,
  YandexIcon,
} from "@/shared/ui/SocialIcons";

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
      icon: GoogleIcon,
    },
    {
      id: "github",
      name: "GitHub",
      icon: GitHubIcon,
    },
    {
      id: "vk",
      name: "VKontakte",
      icon: VKIcon,
    },
    {
      id: "ok",
      name: "Одноклассники",
      icon: OKIcon,
    },
    {
      id: "mail",
      name: "Mail.ru",
      icon: MailIcon,
    },
    {
      id: "yandex",
      name: "Yandex",
      icon: YandexIcon,
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
          <provider.icon className="mr-2 h-4 w-4" />
          {actionType === "register"
            ? "Зарегистрироваться через"
            : "Войти через"}{" "}
          {provider.name}
        </SocialAuthButton>
      ))}
    </div>
  );
}
