import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/account/OrderDetail";
import { requirePageSession } from "@/server/auth/session";
import { createCustomerOrderService } from "@/server/services/customer-order.service";
export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) { const { orderNumber } = await params; const session = await requirePageSession(`/tai-khoan/don-hang/${encodeURIComponent(orderNumber)}`); const order = await createCustomerOrderService().findDetailByOrderNumberAndUserId(orderNumber, session.user.id); if (!order) notFound(); return <main className="bg-background py-16 sm:py-24"><div className="site-shell"><OrderDetail order={order} /></div></main>; }
