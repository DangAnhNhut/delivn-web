"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

export function AuthForm({ mode, returnTo, googleEnabled }: { mode: "login" | "register"; returnTo: string; googleEnabled: boolean }) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const destination = sanitizeReturnTo(returnTo, "/tai-khoan");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("passwordConfirmation") ?? "");

    if (mode === "register" && password !== confirmation) {
      setError("Mật khẩu xác nhận chưa khớp.");
      pendingRef.current = false;
      setPending(false);
      return;
    }

    try {
      const result = mode === "register"
        ? await authClient.signUp.email({ name: String(data.get("name") ?? ""), email, password })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(
          mode === "register"
            ? "Không thể hoàn tất đăng ký. Vui lòng kiểm tra lại thông tin."
            : "Không thể xác thực thông tin. Vui lòng kiểm tra và thử lại."
        );
        pendingRef.current = false;
        setPending(false);
        return;
      }

      router.push(destination);
      router.refresh();
    } catch {
      setError("Không thể xác thực thông tin. Vui lòng thử lại sau.");
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="mx-auto max-w-xl space-y-5 border-y border-border bg-surface px-6 py-10 sm:px-10">
      {mode === "register" ? (
        <label className="block text-sm font-semibold">
          Họ và tên
          <input name="name" required autoComplete="name" className="mt-2 min-h-12 w-full border border-border bg-background px-4" />
        </label>
      ) : null}
      <label className="block text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="email" className="mt-2 min-h-12 w-full border border-border bg-background px-4" />
      </label>
      <label className="block text-sm font-semibold">
        Mật khẩu
        <input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "register" ? "new-password" : "current-password"} className="mt-2 min-h-12 w-full border border-border bg-background px-4" />
      </label>
      {mode === "register" ? (
        <label className="block text-sm font-semibold">
          Xác nhận mật khẩu
          <input name="passwordConfirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-2 min-h-12 w-full border border-border bg-background px-4" />
        </label>
      ) : null}
      {error ? (
        <p role="alert" aria-live="assertive" className="border-l-4 border-accent px-4 text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full bg-foreground px-6 text-xs font-bold tracking-[0.18em] text-background uppercase disabled:opacity-60"
      >
        {pending ? "ĐANG XỬ LÝ" : mode === "register" ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}
      </button>
      {googleEnabled ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: destination })}
          className="min-h-12 w-full border border-foreground px-6 text-xs font-bold tracking-[0.14em] uppercase"
        >
          TIẾP TỤC VỚI GOOGLE
        </button>
      ) : null}
      <p className="text-center text-sm text-foreground-muted">
        {mode === "register" ? (
          <>
            Đã có tài khoản?{" "}
            <Link href={`/tai-khoan/dang-nhap?returnTo=${encodeURIComponent(destination)}`} className="underline">
              Đăng nhập
            </Link>
          </>
        ) : (
          <>
            Chưa có tài khoản?{" "}
            <Link href={`/tai-khoan/dang-ky?returnTo=${encodeURIComponent(destination)}`} className="underline">
              Đăng ký
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
