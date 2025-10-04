import { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface YandexProfile {
  id: string;
  login: string;
  display_name?: string;
  real_name?: string;
  first_name?: string;
  last_name?: string;
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
  default_email?: string;
}

export default function YandexProvider<P extends YandexProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "yandex",
    name: "Yandex",
    type: "oauth",
    authorization: {
      url: "https://oauth.yandex.ru/authorize",
      params: {
        scope: "login:email login:info",
        response_type: "code",
      },
    },
    token: "https://oauth.yandex.ru/token",
    userinfo: {
      url: "https://login.yandex.ru/info",
      async request({ tokens }) {
        const response = await fetch(
          `https://login.yandex.ru/info?format=json&oauth_token=${tokens.access_token}`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.error_msg);
        }

        const name =
          data.display_name ||
          (data.real_name
            ? `${data.first_name} ${data.last_name}`
            : data.login);

        return {
          id: data.id.toString(),
          name: name,
          email: data.default_email,
          image: data.is_avatar_empty
            ? undefined
            : `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`,
        };
      },
    },
    profile(profile) {
      const name =
        profile.display_name ||
        (profile.real_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.login);

      return {
        id: profile.id,
        name: name,
        email: profile.default_email || "",
        image: profile.is_avatar_empty
          ? undefined
          : `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`,
        role: "USER",
      };
    },
    style: {
      logo: "https://yandex.ru/favicon.ico",
      logoDark: "https://yandex.ru/favicon.ico",
      bg: "#FC3F1D",
      text: "#fff",
      bgDark: "#FC3F1D",
      textDark: "#fff",
    },
    options,
  };
}
