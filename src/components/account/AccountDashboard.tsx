import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { GoogleLinkButton } from "./GoogleLinkButton";

export function AccountDashboard({
  name,
  email,
  isGoogleLinked = false,
  googleEnabled = true,
  linkError,
}: {
  name: string;
  email: string;
  isGoogleLinked?: boolean;
  googleEnabled?: boolean;
  linkError?: string | null;
}) {
  return (
    <section className="border-y border-border bg-surface px-6 py-10 sm:px-10">
      <p className="text-sm text-foreground-muted">Xin chào</p>
      <h2 className="mt-2 text-3xl font-bold uppercase">{name}</h2>
      <p className="mt-2 text-sm text-foreground-muted">{email}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/tai-khoan/don-hang"
          className="inline-flex min-h-11 items-center bg-foreground px-5 text-xs font-bold tracking-[0.16em] text-background uppercase"
        >
          ĐƠN HÀNG CỦA TÔI
        </Link>
        <LogoutButton />
      </div>

      {googleEnabled ? (
        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-foreground-muted">
            TÀI KHOẢN LIÊN KẾT
          </h3>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border bg-background p-4">
            <div>
              <p className="text-sm font-semibold">
                Google — {isGoogleLinked ? "Đã liên kết" : "Chưa liên kết"}
              </p>
            </div>
            {!isGoogleLinked ? <GoogleLinkButton /> : null}
          </div>
          {linkError ? (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-4 border-l-4 border-accent px-4 text-sm text-accent"
            >
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
