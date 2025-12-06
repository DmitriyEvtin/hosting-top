/**
 * Email шаблоны для различных уведомлений
 */

import type { EmailTemplate } from "./types";

export const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: "Добро пожаловать в Hosting Top",
    text: "Добро пожаловать! Ваш аккаунт был успешно создан.",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 20px 0;">Добро пожаловать!</h1>
          <p style="color: #666; margin: 0 0 15px 0;">Ваш аккаунт был успешно создан в системе Hosting Top.</p>
          <p style="color: #666; margin: 0 0 20px 0;">Теперь вы можете войти в систему и пользоваться всеми возможностями.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{loginUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Войти в систему</a>
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
      </div>
    `,
  },

  passwordReset: {
    subject: "Сброс пароля - Hosting Top",
    text: "Для сброса пароля перейдите по ссылке: {resetLink}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #856404; margin: 0 0 20px 0;">Сброс пароля</h1>
          <p style="color: #856404; margin: 0 0 15px 0;">Вы запросили сброс пароля для вашего аккаунта.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{resetLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Сбросить пароль</a>
          </div>
          <p style="color: #856404; margin: 20px 0 0 0; font-size: 14px;">Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
          <p style="color: #856404; margin: 10px 0; font-size: 14px; word-break: break-all;">{resetLink}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">Ссылка действительна в течение 1 часа.</p>
      </div>
    `,
  },

  userCreated: {
    subject: "Новый пользователь создан - Hosting Top",
    text: "Новый пользователь {userName} ({userEmail}) был создан администратором.",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #0c5460; margin: 0 0 20px 0;">Новый пользователь создан</h1>
          <p style="color: #0c5460; margin: 0 0 15px 0;">Администратор создал новый аккаунт:</p>
          <ul style="color: #0c5460; margin: 0 0 20px 0; padding-left: 20px;">
            <li><strong>Имя:</strong> {userName}</li>
            <li><strong>Email:</strong> {userEmail}</li>
            <li><strong>Роль:</strong> {userRole}</li>
          </ul>
          <p style="color: #0c5460; margin: 0;">Пользователь может войти в систему используя свой email и пароль.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">Это автоматическое уведомление для администраторов.</p>
      </div>
    `,
  },

  userUpdated: {
    subject: "Профиль обновлен - Hosting Top",
    text: "Ваш профиль был обновлен администратором.",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #155724; margin: 0 0 20px 0;">Профиль обновлен</h1>
          <p style="color: #155724; margin: 0 0 15px 0;">Ваш профиль был обновлен администратором.</p>
          <p style="color: #155724; margin: 0 0 20px 0;">Если у вас есть вопросы, обратитесь к администратору системы.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{profileUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Посмотреть профиль</a>
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
      </div>
    `,
  },
};

export function renderTemplate(
  template: EmailTemplate,
  data: Record<string, string | number | boolean | undefined> = {}
): EmailTemplate {
  let subject = template.subject;
  let text = template.text;
  let html = template.html;

  // Заменяем плейсхолдеры данными
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    const value = data[key] || "";
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    text = text.replace(new RegExp(placeholder, "g"), value);
    html = html.replace(new RegExp(placeholder, "g"), value);
  });

  return { subject, text, html };
}
