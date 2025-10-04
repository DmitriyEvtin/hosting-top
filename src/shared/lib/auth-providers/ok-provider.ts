import { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface OKProfile {
  uid: string;
  first_name: string;
  last_name: string;
  pic_2?: string;
  email?: string;
}

export default function OKProvider<P extends OKProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "ok",
    name: "Одноклассники",
    type: "oauth",
    authorization: {
      url: "https://connect.ok.ru/oauth/authorize",
      params: {
        scope: "VALUABLE_ACCESS",
        response_type: "code",
      },
    },
    token: "https://api.ok.ru/oauth/token.do",
    userinfo: {
      url: "https://api.ok.ru/fb.do",
      async request({ tokens, provider }) {
        const params = new URLSearchParams({
          method: "users.getCurrentUser",
          access_token: tokens.access_token!,
          format: "json",
          fields: "uid,first_name,last_name,pic_2,email",
        });

        const response = await fetch(`${provider.userinfo?.url}?${params}`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.error_msg);
        }

        return {
          id: data.uid.toString(),
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          image: data.pic_2,
        };
      },
    },
    profile(profile) {
      return {
        id: profile.uid,
        name: profile.first_name + " " + profile.last_name,
        email: profile.email,
        image: profile.pic_2,
        role: "USER",
      };
    },
    style: {
      logo: "https://ok.ru/favicon.ico",
      logoDark: "https://ok.ru/favicon.ico",
      bg: "#EE8208",
      text: "#fff",
      bgDark: "#EE8208",
      textDark: "#fff",
    },
    options,
  };
}
