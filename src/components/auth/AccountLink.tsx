"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
export function AccountLink({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  const { data } = authClient.useSession();
  return <Link href={data?.user ? "/tai-khoan" : "/tai-khoan/dang-nhap"} onClick={onClick} className={className}>{data?.user ? "TÀI KHOẢN" : "ĐĂNG NHẬP"}</Link>;
}
