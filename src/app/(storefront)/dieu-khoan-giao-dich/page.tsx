import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = { title: "Điều khoản giao dịch", description: LEGAL_PAGES["/dieu-khoan-giao-dich"].description };
export default function TransactionTermsPage() { return <LegalPage page={LEGAL_PAGES["/dieu-khoan-giao-dich"]} />; }
