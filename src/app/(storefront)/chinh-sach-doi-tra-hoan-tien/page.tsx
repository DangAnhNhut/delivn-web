import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = { title: "Đổi trả và hoàn tiền", description: LEGAL_PAGES["/chinh-sach-doi-tra-hoan-tien"].description };
export default function ReturnsPolicyPage() { return <LegalPage page={LEGAL_PAGES["/chinh-sach-doi-tra-hoan-tien"]} />; }
