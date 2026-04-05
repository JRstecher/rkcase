import NextAuth, { type NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const oauth: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauth.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  oauth.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  oauth.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  );
}

if (oauth.length === 0) {
  oauth.push(
    Credentials({
      id: "_noop",
      name: "_noop",
      credentials: {},
      authorize: async () => null,
    }),
  );
}

const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  "dev-auth-secret-change-in-production";

const missingAuthSecret =
  !process.env.AUTH_SECRET?.trim() && !process.env.NEXTAUTH_SECRET?.trim();
if (
  missingAuthSecret &&
  process.env.NODE_ENV === "production" &&
  process.env.npm_lifecycle_event !== "build"
) {
  console.warn(
    "[auth] AUTH_SECRET / NEXTAUTH_SECRET absents — définit AUTH_SECRET en production.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: oauth,
  secret: authSecret,
  trustHost: true,
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      if (profile && "sub" in profile && profile.sub) {
        token.sub = String(profile.sub);
      }
      if (profile && "email" in profile && profile.email) {
        token.email = String(profile.email);
      }
      if (profile && "name" in profile && profile.name) {
        token.name = String(profile.name);
      }
      if (profile && "picture" in profile && profile.picture) {
        token.picture = String(profile.picture);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.picture === "string") session.user.image = token.picture;
      }
      return session;
    },
  },
});
