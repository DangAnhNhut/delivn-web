import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = { title: "Chính sách vận chuyển", description: LEGAL_PAGES["/chinh-sach-van-chuyen"].description };
export default function ShippingPolicyPage() { return <LegalPage page={LEGAL_PAGES["/chinh-sach-van-chuyen"]} />; }
