/**
 * Типы для email сервиса
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendTemplate(
    template: string,
    to: string | string[],
    data?: EmailTemplateData
  ): Promise<void>;
  isConfigured(): boolean;
}

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  resetLink?: string;
  loginUrl?: string;
  profileUrl?: string;
  [key: string]: string | number | boolean | undefined;
}
