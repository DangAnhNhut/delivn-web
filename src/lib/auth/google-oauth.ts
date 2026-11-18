import { sanitizeReturnTo } from "./return-to";

export type GoogleAuthMode = "login" | "register";

export const GOOGLE_OAUTH_ERROR_MESSAGE =
  "Không thể hoàn tất đăng nhập bằng Google. Vui lòng thử lại hoặc dùng email và mật khẩu.";

export function buildGoogleOAuthErrorCallback(
  mode: GoogleAuthMode,
  returnTo: string,
): string {
  const destination = sanitizeReturnTo(returnTo, "/tai-khoan");
  const path = mode === "register"
    ? "/tai-khoan/dang-ky"
    : "/tai-khoan/dang-nhap";
  const params = new URLSearchParams({
    oauthError: "1",
    returnTo: destination,
  });
  return `${path}?${params.toString()}`;
}

export function hasGoogleOAuthCallbackError(
  searchParams: Record<string, string | undefined>,
): boolean {
  return searchParams.oauthError === "1" || typeof searchParams.error === "string";
}
