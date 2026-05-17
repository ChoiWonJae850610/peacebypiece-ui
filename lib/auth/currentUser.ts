export type WaflCurrentUserRole = "company_admin" | "member" | "system_admin";

export type WaflCurrentUser = {
  id: string;
  name: string;
  email: string;
  role: WaflCurrentUserRole;
  companyId: string | null;
  companyName: string | null;
  companyMemberId: string | null;
  profileComplete?: boolean;
};

export type WaflCurrentUserResponse =
  | {
      authenticated: true;
      user: WaflCurrentUser;
    }
  | {
      authenticated: false;
      user?: never;
    };
