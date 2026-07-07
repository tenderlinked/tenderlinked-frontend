import "next-auth";

declare module "next-auth" {
  interface User {
    tenantId?: string;
    tenantName?: string;
    hasActivePlan?: boolean;
    role?: string;
  }
  interface Session {
    user: User;
    accessToken?: string;
  }
}
