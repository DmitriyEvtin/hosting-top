/**
 * Email клиент с использованием nodemailer
 */

import { env, hasSmtp } from "@/shared/lib/env-simple";
import nodemailer from "nodemailer";
import type { EmailOptions, EmailService, EmailTemplateData } from "./types";

class EmailServiceImpl implements EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (hasSmtp) {
      const transporterConfig: nodemailer.TransportOptions = {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465, // true для 465, false для других портов
        tls: {
          rejectUnauthorized: false, // Для development
        },
      };

      // Добавляем аутентификацию только если есть пользователь и пароль
      if (env.SMTP_USER && env.SMTP_PASSWORD) {
        transporterConfig.auth = {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        };
      }

      this.transporter = nodemailer.createTransport(transporterConfig);
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error(
        "Email service is not configured. Please check SMTP settings."
      );
    }

    const mailOptions = {
      from: options.from || env.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendTemplate(
    template: string,
    to: string | string[],
    data: EmailTemplateData = {}
  ): Promise<void> {
    // Здесь можно добавить логику для шаблонов
    // Пока что просто отправляем базовое сообщение
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _data = data; // Пока не используется, но может понадобиться в будущем
    await this.sendEmail({
      to,
      subject: "Уведомление",
      text: `Шаблон: ${template}`,
      html: `<p>Шаблон: ${template}</p>`,
    });
  }

  isConfigured(): boolean {
    return hasSmtp && this.transporter !== null;
  }
}

// Экспортируем singleton instance
export const emailService = new EmailServiceImpl();
