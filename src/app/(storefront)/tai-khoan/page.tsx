import { AccountDashboard } from "@/components/account/AccountDashboard";
import { requirePageSession } from "@/server/auth/session";
export default async function AccountPage() { const session = await requirePageSession("/tai-khoan"); return <main className="bg-background py-16 sm:py-24"><div className="site-shell"><h1 className="mb-10 text-4xl font-bold uppercase sm:text-6xl">TÀI KHOẢN</h1><AccountDashboard name={session.user.name} email={session.user.email} /></div></main>; }
