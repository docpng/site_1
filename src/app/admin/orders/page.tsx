import { setOrderStatus } from "@/app/actions/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

type Shipping = {
  name?: string;
  address?: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string };
} | null;

export default async function Orders() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Order[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-muted">Orders are created automatically when Stripe confirms a payment. Refunds are issued from the Stripe dashboard.</p>
      <ul className="mt-6 space-y-4">
        {!orders?.length && <li className="card p-6 text-sm text-muted">No orders yet.</li>}
        {orders?.map((o) => {
          const ship = o.shipping as Shipping;
          const needsShipping = o.order_items.some((i) => i.kind === "physical");
          return (
            <li key={o.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium">{formatDate(o.created_at)}</span>
                <span className="text-muted">{o.email}</span>
                <span className="ml-auto font-semibold">{formatPrice(o.amount_total, o.currency)}</span>
                <form action={setOrderStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status} className="input w-auto py-1">
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button className="btn-secondary py-1">Update</button>
                </form>
              </div>
              <ul className="mt-3 text-sm">
                {o.order_items.map((i) => (
                  <li key={i.id}>
                    {i.quantity} × {i.title} <span className="text-muted">({i.kind})</span>
                  </li>
                ))}
              </ul>
              {needsShipping && ship?.address && (
                <p className="mt-3 rounded-lg bg-brand-50 p-3 text-xs">
                  <strong>Ship to:</strong> {ship.name}, {ship.address.line1}
                  {ship.address.line2 ? `, ${ship.address.line2}` : ""}, {ship.address.city} {ship.address.state} {ship.address.postal_code},{" "}
                  {ship.address.country}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
