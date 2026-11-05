import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = { title: "Thông tin doanh nghiệp", description: LEGAL_PAGES["/thong-tin-doanh-nghiep"].description };
export default function BusinessInformationPage() { return <LegalPage page={LEGAL_PAGES["/thong-tin-doanh-nghiep"]} />; }
