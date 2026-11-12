import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { auth, type AuthSession } from "./auth";

type SessionApi = { getSession(input: { headers: Headers }): Promise<AuthSession | null> };

export async function getSessionFromHeaders(
  requestHeaders: Headers,
  api: SessionApi = auth.api,
): Promise<AuthSession | null> {
  return api.getSession({ headers: requestHeaders });
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return getSessionFromHeaders(await headers());
}

export async function requirePageSession(
  returnTo: string,
  getSession: () => Promise<AuthSession | null> = getCurrentSession,
): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    const destination = sanitizeReturnTo(returnTo, "/tai-khoan");
    redirect(`/tai-khoan/dang-nhap?returnTo=${encodeURIComponent(destination)}`);
  }
  return session;
}
