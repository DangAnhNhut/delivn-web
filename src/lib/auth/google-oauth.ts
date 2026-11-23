import { sanitizeReturnTo } from "./return-to";

export type GoogleAuthMode = "login" | "register";

export const GOOGLE_OAUTH_ERROR_MESSAGE =
  "Không thể hoàn tất đăng nhập bằng Google. Vui lòng thử lại hoặc dùng email và mật khẩu.";

export const GOOGLE_ACCOUNT_NOT_LINKED_MESSAGE =
  "Tài khoản email này đã tồn tại. Vui lòng đăng nhập bằng mật khẩu trước, sau đó liên kết Google trong trang tài khoản.";

export const GOOGLE_LINK_ERROR_MESSAGES: Record<string, string> = {
  email_does_not_match:
    "Tài khoản Google phải sử dụng cùng email với tài khoản DELIVN hiện tại.",
  account_already_linked_to_different_user:
    "Tài khoản Google này đã được liên kết với một tài khoản khác.",
  unverified_google_email:
    "Email Google chưa được xác thực. Vui lòng xác thực email trên Google trước khi liên kết.",
  email_not_verified:
    "Email Google chưa được xác thực. Vui lòng xác thực email trên Google trước khi liên kết.",
  unable_to_link_account:
    "Không thể liên kết tài khoản Google. Vui lòng đảm bảo email Google đã được xác thực.",
  access_denied:
    "Quá trình liên kết Google đã bị hủy.",
};

export const GOOGLE_LINK_DEFAULT_ERROR_MESSAGE =
  "Không thể hoàn tất liên kết tài khoản Google. Vui lòng thử lại sau.";

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

export function resolveGoogleOAuthErrorMessage(
  searchParams: Record<string, string | undefined>,
): string | null {
  const error = searchParams.error;
  if (error === "account_not_linked" || error === "account not linked") {
    return GOOGLE_ACCOUNT_NOT_LINKED_MESSAGE;
  }
  if (searchParams.oauthError === "1" || typeof error === "string") {
    return GOOGLE_OAUTH_ERROR_MESSAGE;
  }
  return null;
}

export function resolveAccountLinkErrorMessage(
  searchParams: Record<string, string | undefined>,
): string | null {
  const error = searchParams.error;
  if (!error && !searchParams.linkError) return null;
  if (error && GOOGLE_LINK_ERROR_MESSAGES[error]) {
    return GOOGLE_LINK_ERROR_MESSAGES[error];
  }
  return GOOGLE_LINK_DEFAULT_ERROR_MESSAGE;
}
