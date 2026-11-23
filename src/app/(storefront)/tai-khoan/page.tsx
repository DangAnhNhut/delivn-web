import { headers } from "next/headers";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { resolveAccountLinkErrorMessage } from "@/lib/auth/google-oauth";
import { auth } from "@/server/auth/auth";
import { resolveAuthEnvironment } from "@/server/auth/auth-environment";
import { requirePageSession } from "@/server/auth/session";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; linkError?: string }>;
}) {
  const session = await requirePageSession("/tai-khoan");
  const requestHeaders = await headers();
  const accounts = await auth.api.listUserAccounts({ headers: requestHeaders }).catch(() => []);
  const isGoogleLinked = accounts.some((account) => account.providerId === "google");
  const googleEnabled = resolveAuthEnvironment(process.env).google !== null;
  const params = searchParams ? await searchParams : {};
  const linkError = resolveAccountLinkErrorMessage(params);

  return (
    <main className="bg-background py-16 sm:py-24">
      <div className="site-shell">
        <h1 className="mb-10 text-4xl font-bold uppercase sm:text-6xl">TÀI KHOẢN</h1>
        <AccountDashboard
          name={session.user.name}
          email={session.user.email}
          isGoogleLinked={isGoogleLinked}
          googleEnabled={googleEnabled}
          linkError={linkError}
        />
      </div>
    </main>
  );
}
