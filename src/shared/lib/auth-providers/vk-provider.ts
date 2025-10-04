import { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface VKProfile {
  id: string;
  first_name: string;
  last_name: string;
  photo_200?: string;
  email?: string;
}

export default function VKProvider<P extends VKProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "vk",
    name: "VKontakte",
    type: "oauth",
    authorization: {
      url: "https://oauth.vk.com/authorize",
      params: {
        scope: "email",
        response_type: "code",
        v: "5.131",
      },
    },
    token: "https://oauth.vk.com/access_token",
    userinfo: {
      url: "https://api.vk.com/method/users.get",
      async request({ tokens, provider }) {
        const response = await fetch(
          `${provider.userinfo?.url}?fields=photo_200&access_token=${tokens.access_token}&v=5.131`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.error_msg);
        }

        const user = data.response[0];
        return {
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          email: tokens.email,
          image: user.photo_200,
        };
      },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.first_name + " " + profile.last_name,
        email: profile.email,
        image: profile.photo_200,
        role: "USER",
      };
    },
    style: {
      logo: "https://vk.com/favicon.ico",
      logoDark: "https://vk.com/favicon.ico",
      bg: "#0077FF",
      text: "#fff",
      bgDark: "#0077FF",
      textDark: "#fff",
    },
    options,
  };
}
