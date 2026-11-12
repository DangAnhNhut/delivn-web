"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");

    try {
      const result = await authClient.signOut();
      if (result?.error) {
        setError("Không thể đăng xuất. Vui lòng thử lại sau.");
        pendingRef.current = false;
        setPending(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Không thể đăng xuất. Vui lòng thử lại sau.");
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleSignOut}
        className="min-h-11 border border-foreground px-5 text-xs font-bold tracking-[0.16em] uppercase disabled:opacity-60"
      >
        {pending ? "ĐANG XỬ LÝ..." : "ĐĂNG XUẤT"}
      </button>
      {error ? (
        <p role="alert" aria-live="assertive" className="text-xs text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}
