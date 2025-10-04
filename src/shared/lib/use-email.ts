/**
 * Хук для работы с email сервисом
 */

"use client";

import { useEffect, useState } from "react";
import { hasSmtp } from "./env-simple";

interface UseEmailResult {
  sendEmail: (options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }) => Promise<void>;
  sendTemplate: (
    template: string,
    to: string | string[],
    data?: Record<string, string | number | boolean | undefined>
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
}

export function useEmail(): UseEmailResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Проверяем конфигурацию email через API
    const checkEmailConfig = async () => {
      try {
        const response = await fetch("/api/email/status");
        if (response.ok) {
          const data = await response.json();
          setEmailConfigured(data.configured);
        }
      } catch (err) {
        console.error("Failed to check email configuration:", err);
        setEmailConfigured(false);
      }
    };

    checkEmailConfig();
  }, []);

  const sendEmail = async (options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }) => {
    if (!hasSmtp) {
      throw new Error("Email service is not configured");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send email";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTemplate = async (
    template: string,
    to: string | string[],
    data: Record<string, string | number | boolean | undefined> = {}
  ) => {
    if (!hasSmtp) {
      throw new Error("Email service is not configured");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/email/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ template, to, data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send template email");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send template email";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmail,
    sendTemplate,
    isLoading,
    error,
    isConfigured: isClient ? emailConfigured : false,
  };
}
