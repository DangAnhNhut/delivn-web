import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
export function AccountDashboard({ name, email }: { name: string; email: string }) {
  return <section className="border-y border-border bg-surface px-6 py-10 sm:px-10"><p className="text-sm text-foreground-muted">Xin chào</p><h2 className="mt-2 text-3xl font-bold uppercase">{name}</h2><p className="mt-2 text-sm text-foreground-muted">{email}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/tai-khoan/don-hang" className="inline-flex min-h-11 items-center bg-foreground px-5 text-xs font-bold tracking-[0.16em] text-background uppercase">ĐƠN HÀNG CỦA TÔI</Link><LogoutButton /></div></section>;
}
