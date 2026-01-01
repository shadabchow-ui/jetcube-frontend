import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

type Order = {
  id: string;
  provider_payment_id: string;
  status: string;
  currency: string;
  total_cents: number;
  email: string | null;
  created_at: string;
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `http://localhost:4242/api/orders/${id}`
        );

        if (!res.ok) {
          throw new Error("Order not found");
        }

        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError("Could not load order");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading order…</div>;
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-red-600">
        {error ?? "Order not found"}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        to="/orders"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to orders
      </Link>

      <h1 className="text-2xl font-semibold mt-4 mb-6">
        Order Details
      </h1>

      <div className="border rounded-lg p-6 space-y-4">
        <div>
          <div className="text-sm text-gray-500">Order ID</div>
          <div className="font-mono">{order.id}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Payment ID</div>
          <div className="font-mono">
            {order.provider_payment_id}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="capitalize">{order.status}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Total</div>
          <div className="font-medium">
            ${(order.total_cents / 100).toFixed(2)}{" "}
            {order.currency}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Date</div>
          <div>
            {new Date(order.created_at).toLocaleString()}
          </div>
        </div>

        {order.email && (
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div>{order.email}</div>
          </div>
        )}
      </div>
    </div>
  );
}
