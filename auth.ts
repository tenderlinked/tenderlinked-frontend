import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import Credentials from "next-auth/providers/credentials"

const rawRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
const rootDomain = rawRootDomain.split(':')[0];
const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
// Set domain to .lvh.me for local testing across subdomains
const cookieDomain = process.env.NODE_ENV === "production" ? ".tenderlinked.com" : (rootDomain === 'localhost' ? undefined : `.${rootDomain}`);

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  debug: true,
  trustHost: true,
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies, ...(cookieDomain ? { domain: cookieDomain } : {}) },
    },
    callbackUrl: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.callback-url`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies, ...(cookieDomain ? { domain: cookieDomain } : {}) },
    },
    csrfToken: {
      // IMPORTANT: CSRF cookies must NOT have a domain attribute.
      // They are host-bound by design. Setting a domain breaks NextAuth's CSRF validation.
      name: "next-auth.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    }
  },
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const issuer = process.env.KEYCLOAK_ISSUER;
          const tokenUrl = `${issuer}/protocol/openid-connect/token`;
          
          let finalUsername = credentials.email as string;
          
          try {
            const resolveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/resolve-identifier?identifier=${encodeURIComponent(finalUsername)}`);
            if (resolveRes.ok) {
              const resolvedData = await resolveRes.json();
              if (resolvedData.username) {
                 finalUsername = resolvedData.username;
              }
            } else {
              // If backend rejects the identifier (e.g. phone not found), fail early
              return null;
            }
          } catch (e) {
            console.error("Failed to resolve identifier", e);
          }

          const body = new URLSearchParams({
            grant_type: "password",
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
            username: finalUsername,
            password: credentials.password as string,
            scope: "openid profile email",
          });
          
          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          });
          
          if (!response.ok) {
            console.error("Keycloak auth failed", await response.text());
            return null;
          }
          
          const tokens = await response.json();
          
          const userInfoRes = await fetch(`${issuer}/protocol/openid-connect/userinfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          
          if (!userInfoRes.ok) return null;
          const user = await userInfoRes.json();
          
          // Check backend for active subscription
          let hasActivePlan = false;
          let tenantId = null;
          let tenantName = null;
          let isSuspended = false;
          try {
             const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/profile/${user.sub}?email=${encodeURIComponent(user.email || '')}`, {
               headers: { Authorization: `Bearer ${tokens.access_token}` }
             });
             if (profRes.ok) {
               const profData = await profRes.json();
               tenantId = profData.tenant?.id || null;
               tenantName = profData.tenant?.name || null;
               user.globalRole = profData.globalRole || 'USER';
               user.permissions = profData.permissions || [];
               user.phoneNumber = profData.phoneNumber || null;
               if (profData.tenant?.subscription?.status === 'SUSPENDED') {
                 isSuspended = true;
               }
             }
             
             const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/subscriptions/${user.sub}/active`, {
               headers: {
                 'x-internal-secret': process.env.INTERNAL_API_SECRET || 'fallback-internal-secret-xyz'
               }
             });
             if (subRes.ok) {
               const subData = await subRes.json();
               hasActivePlan = subData.hasActivePlan;
             }
          } catch(e) {
             console.error("Failed to fetch subscription", e);
          }
          
          return {
            id: user.sub,
            name: user.name || (user.given_name ? `${user.given_name} ${user.family_name || ''}`.trim() : user.preferred_username),
            email: user.email,
            hasActivePlan,
            tenantId,
            tenantName,
            globalRole: user.globalRole || 'USER',
            permissions: user.permissions || [],
            phoneNumber: user.phoneNumber || null,
            accessToken: tokens.access_token,
            isSuspended
          };
          
        } catch (e: any) {
          console.error("Authorize error", e);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register'
  },
  callbacks: {
    async jwt({ token, profile, user, account, trigger, session }) {
      if (profile) {
        token.id = profile.sub;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        if (user.id) token.id = user.id;
        // @ts-ignore
        if (user.hasActivePlan !== undefined) token.hasActivePlan = user.hasActivePlan;
        // @ts-ignore
        if (user.tenantId !== undefined) token.tenantId = user.tenantId;
        // @ts-ignore
        if (user.tenantName !== undefined) token.tenantName = user.tenantName;
        // @ts-ignore
        if (user.globalRole !== undefined) token.globalRole = user.globalRole;
        // @ts-ignore
        if (user.permissions !== undefined) token.permissions = user.permissions;
        // @ts-ignore
        if (user.accessToken) token.accessToken = user.accessToken;
        // @ts-ignore
        if (user.isSuspended !== undefined) token.isSuspended = user.isSuspended;
        // @ts-ignore
        if (user.phoneNumber !== undefined) token.phoneNumber = user.phoneNumber;
      }
      
      // If we log in via OAuth Keycloak (not Credentials), we need to fetch subscription here
      if (profile && !user?.hasOwnProperty('hasActivePlan')) {
        try {
           const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/profile/${profile.sub}?email=${encodeURIComponent((profile as any).email || '')}`, {
             headers: { Authorization: `Bearer ${account?.access_token}` }
           });
           if (profRes.ok) {
             const profData = await profRes.json();
             token.tenantId = profData.tenant?.id || null;
             token.tenantName = profData.tenant?.name || null;
             token.globalRole = profData.globalRole || 'USER';
             token.permissions = profData.permissions || [];
             token.phoneNumber = profData.phoneNumber || null;
             
             if (profData.tenant?.subscription?.status === 'SUSPENDED') {
               token.isSuspended = true;
             }
           }

           const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/subscriptions/${profile.sub}/active`);
           if (subRes.ok) {
             const subData = await subRes.json();
             token.hasActivePlan = subData.hasActivePlan;
           } else {
             token.hasActivePlan = false;
           }
        } catch(e) {
           token.hasActivePlan = false;
        }
      }

      // Handle manual session updates (e.g. after successful payment)
      if (trigger === "update") {
        if (session?.hasActivePlan !== undefined) {
          token.hasActivePlan = session.hasActivePlan;
        } 
        if (session?.tenantId !== undefined) {
          token.tenantId = session.tenantId;
        }
        if (session?.tenantName !== undefined) {
          token.tenantName = session.tenantName;
        }
        if (session?.phoneNumber !== undefined) {
          token.phoneNumber = session.phoneNumber;
        }
        
        if (token.id && session?.hasActivePlan === undefined && session?.tenantId === undefined) {
          try {
             const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/subscriptions/${token.id}/active`);
             if (subRes.ok) {
               const subData = await subRes.json();
               token.hasActivePlan = subData.hasActivePlan;
             }
          } catch(e) {
             console.error("Failed to update session subscription", e);
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      if (session.user) {
        // @ts-ignore
        session.user.hasActivePlan = token.hasActivePlan as boolean;
        // @ts-ignore
        session.user.tenantId = token.tenantId as string | null;
        // @ts-ignore
        session.user.tenantName = token.tenantName as string | null;
        // @ts-ignore
        session.user.globalRole = (token.globalRole as string) || 'USER';
        // @ts-ignore
        session.user.permissions = (token.permissions as string[]) || [];
        // @ts-ignore
        session.accessToken = token.accessToken as string | undefined;
        // @ts-ignore
        session.user.isSuspended = token.isSuspended as boolean | undefined;
        // @ts-ignore
        session.user.phoneNumber = token.phoneNumber as string | null;
      }
      return session;
    }
  }
})