"use client";

import { Button } from "@/shared/ui/Button";
import { signIn } from "next-auth/react";
import { useState } from "react";

interface SocialAuthButtonProps {
  provider: string;
  children: React.ReactNode;
  callbackUrl?: string;
  className?: string;
  disabled?: boolean;
}

export function SocialAuthButton({
  provider,
  children,
  callbackUrl = "/",
  className,
  disabled = false,
}: SocialAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`Ошибка входа через ${provider}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSignIn}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? "Вход..." : children}
    </Button>
  );
}
