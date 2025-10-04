import { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface MailProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export default function MailProvider<P extends MailProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "mail",
    name: "Mail.ru",
    type: "oauth",
    authorization: {
      url: "https://oauth.mail.ru/login",
      params: {
        scope: "userinfo",
        response_type: "code",
      },
    },
    token: "https://oauth.mail.ru/token",
    userinfo: {
      url: "https://oauth.mail.ru/userinfo",
      async request({ tokens, provider }) {
        const response = await fetch(
          `${provider.userinfo?.url}?access_token=${tokens.access_token}`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.error_msg);
        }

        return {
          id: data.id.toString(),
          name: data.name,
          email: data.email,
          image: data.picture,
        };
      },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: "USER",
      };
    },
    style: {
      logo: "https://mail.ru/favicon.ico",
      logoDark: "https://mail.ru/favicon.ico",
      bg: "#005FF0",
      text: "#fff",
      bgDark: "#005FF0",
      textDark: "#fff",
    },
    options,
  };
}
