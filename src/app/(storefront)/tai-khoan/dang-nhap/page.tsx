import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { resolveAuthEnvironment } from "@/server/auth/auth-environment";
import { getCurrentSession } from "@/server/auth/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const session = await getCurrentSession();
  const destination = sanitizeReturnTo((await searchParams).returnTo, "/tai-khoan");
  if (session) redirect(destination);
  const googleEnabled = resolveAuthEnvironment(process.env).google !== null;
  return <section className="bg-background py-16 sm:py-24"><div className="site-shell"><header className="mb-10 text-center"><p className="text-xs font-bold tracking-[0.24em] uppercase">TÀI KHOẢN DELIVN</p><h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] uppercase sm:text-6xl">ĐĂNG NHẬP</h1></header><AuthForm mode="login" returnTo={destination} googleEnabled={googleEnabled} /></div></section>;
}
