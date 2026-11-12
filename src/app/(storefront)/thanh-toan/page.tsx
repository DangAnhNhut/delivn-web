import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { requirePageSession } from "@/server/auth/session";

export default async function ThanhToanPage() {
  await requirePageSession("/thanh-toan");
  return <CheckoutClient />;
}
