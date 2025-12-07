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

/**
 * Данные для email уведомления об одобрении отзыва
 */
export interface ReviewApprovedEmailData {
  userName: string;
  hostingName: string;
  reviewContent: string;
  reviewUrl: string;
}

/**
 * Данные для email уведомления об отклонении отзыва
 */
export interface ReviewRejectedEmailData {
  userName: string;
  hostingName: string;
  reviewContent: string;
  rejectionReason: string;
}

/**
 * Генерирует email шаблон для уведомления об одобрении отзыва
 */
export function getReviewApprovedEmailTemplate(
  data: ReviewApprovedEmailData
): EmailTemplate {
  const subject = "Ваш отзыв одобрен";

  const text = `
Здравствуйте, ${data.userName}!

Ваш отзыв о хостинге "${data.hostingName}" был одобрен и опубликован на сайте.

Спасибо за ваш вклад в развитие нашего каталога!

Просмотреть отзыв: ${data.reviewUrl}

С уважением,
Команда Hosting Top
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #155724; margin: 0 0 20px 0;">Ваш отзыв одобрен</h2>
        <p style="color: #155724; margin: 0 0 15px 0;">Здравствуйте, ${data.userName}!</p>
        <p style="color: #155724; margin: 0 0 15px 0;">Ваш отзыв о хостинге <strong>"${data.hostingName}"</strong> был одобрен и опубликован на сайте.</p>
        <p style="color: #155724; margin: 0 0 20px 0;">Спасибо за ваш вклад в развитие нашего каталога!</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${data.reviewUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Просмотреть отзыв</a>
        </div>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; margin: 0;">С уважением,<br>Команда Hosting Top</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Генерирует email шаблон для уведомления об отклонении отзыва
 */
export function getReviewRejectedEmailTemplate(
  data: ReviewRejectedEmailData
): EmailTemplate {
  const subject = "Ваш отзыв отклонен";

  const text = `
Здравствуйте, ${data.userName}!

К сожалению, ваш отзыв о хостинге "${data.hostingName}" был отклонен модератором.

Причина отклонения:
${data.rejectionReason}

Вы можете отредактировать отзыв и отправить его на повторную модерацию.

С уважением,
Команда Hosting Top
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #721c24; margin: 0 0 20px 0;">Ваш отзыв отклонен</h2>
        <p style="color: #721c24; margin: 0 0 15px 0;">Здравствуйте, ${data.userName}!</p>
        <p style="color: #721c24; margin: 0 0 15px 0;">К сожалению, ваш отзыв о хостинге <strong>"${data.hostingName}"</strong> был отклонен модератором.</p>
        <h3 style="color: #721c24; margin: 20px 0 10px 0;">Причина отклонения:</h3>
        <p style="color: #721c24; margin: 0 0 20px 0; padding: 10px; background-color: #fff; border-left: 4px solid #dc3545;">${data.rejectionReason}</p>
        <p style="color: #721c24; margin: 0;">Вы можете отредактировать отзыв и отправить его на повторную модерацию.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; margin: 0;">С уважением,<br>Команда Hosting Top</p>
    </div>
  `;

  return { subject, text, html };
}
