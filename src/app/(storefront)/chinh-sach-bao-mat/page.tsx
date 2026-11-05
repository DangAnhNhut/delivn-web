import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = { title: "Chính sách bảo mật", description: LEGAL_PAGES["/chinh-sach-bao-mat"].description };
export default function PrivacyPolicyPage() { return <LegalPage page={LEGAL_PAGES["/chinh-sach-bao-mat"]} />; }
