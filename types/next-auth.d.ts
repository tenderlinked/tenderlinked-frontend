import "next-auth";

declare module "next-auth" {
  interface User {
    tenantSubdomain?: string;
    hasActivePlan?: boolean;
    role?: string;
  }
  interface Session {
    user: User;
  }
}
