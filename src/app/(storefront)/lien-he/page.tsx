import type { Metadata } from "next";
import { ContactHub } from "@/components/contact/ContactHub";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: LEGAL_PAGES["/lien-he"].description,
};

export default function ContactPage() {
  return <ContactHub />;
}
