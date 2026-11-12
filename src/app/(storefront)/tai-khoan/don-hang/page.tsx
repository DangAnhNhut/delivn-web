import { OrderList } from "@/components/account/OrderList";
import { requirePageSession } from "@/server/auth/session";
import { createCustomerOrderService } from "@/server/services/customer-order.service";
export default async function OrdersPage() { const session = await requirePageSession("/tai-khoan/don-hang"); const orders = await createCustomerOrderService().listByUserId(session.user.id); return <main className="bg-background py-16 sm:py-24"><div className="site-shell"><h1 className="mb-10 text-4xl font-bold uppercase sm:text-6xl">ĐƠN HÀNG CỦA TÔI</h1><OrderList orders={orders} /></div></main>; }
