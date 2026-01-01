import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Order = {
  id: string;
  provider_payment_id: string;
  status: string;
  currency: string;
  total_cents: number;
  created_at: string;
};

export default function OrdersPage() {
  // TEMP: replace later with logged-in user email
  const email = "test@example.com";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch(
          `http://localhost:4242/api/orders?email=${encodeURIComponent(
            email
          )}`
        );

        if (!res.ok) {
          throw new Error("Failed to load orders");
        }

        const data = await res.json();
        setOrders(data.orders);
      } catch (err) {
        setError("Could not load orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading your orders…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        You don’t have any orders yet.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Your Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            to={`/orders/${order.id}`}
            key={order.id}
            className="block border rounded-lg hover:bg-gray-50 transition"
          >
            {/* Header strip (Amazon-like) */}
            <div className="bg-gray-100 px-4 py-2 rounded-t-lg flex flex-wrap justify-between text-sm text-gray-600">
              <div>
                <div className="uppercase text-[11px] text-gray-500">
                  Order placed
                </div>
                <div>
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="text-right">
                <div className="uppercase text-[11px] text-gray-500">
                  Order #
                </div>
                <div className="font-mono">
                  {order.provider_payment_id.slice(0, 12)}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex items-center justify-between gap-4">
              {/* Left */}
              <div>
                <div className="text-sm font-medium">
                  Order total
                </div>
                <div className="text-lg font-semibold">
                  ${(order.total_cents / 100).toFixed(2)}
                </div>
              </div>

              {/* Right */}
              <div className="text-right">
                <div className="text-sm font-medium capitalize">
                  {order.status}
                </div>
                <div className="text-sm text-blue-600">
                  View order details →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

