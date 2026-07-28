import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    tenantId?: string;
    tenantName?: string;
    hasActivePlan?: boolean;
    role?: string;
    globalRole?: string;
    tenantRole?: string;
  }
  interface Session {
    user: User;
    accessToken?: string;
  }
}
