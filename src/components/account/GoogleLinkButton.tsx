"use client";

import { useRef, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

export function GoogleLinkButton() {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);

    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/tai-khoan",
        errorCallbackURL: "/tai-khoan",
      });

      if (result?.error) {
        setError("Không thể kết nối với Google. Vui lòng thử lại.");
        pendingRef.current = false;
        setPending(false);
        return;
      }

      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      setError("Không thể kết nối với Google. Vui lòng thử lại.");
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleLink}
        className="min-h-10 border border-foreground bg-background px-4 text-xs font-bold tracking-[0.14em] uppercase transition hover:bg-foreground hover:text-background disabled:opacity-60"
      >
        {pending ? "ĐANG KẾT NỐI GOOGLE" : "Liên kết Google"}
      </button>
      {error ? (
        <p role="alert" aria-live="assertive" className="text-xs text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

