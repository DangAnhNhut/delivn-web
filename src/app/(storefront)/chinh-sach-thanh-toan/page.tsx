import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = { title: "Chính sách thanh toán", description: LEGAL_PAGES["/chinh-sach-thanh-toan"].description };
export default function PaymentPolicyPage() { return <LegalPage page={LEGAL_PAGES["/chinh-sach-thanh-toan"]} />; }
