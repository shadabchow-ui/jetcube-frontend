import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export const ShopHubSection = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const categories = [
    { name: "Jewelry", slug: "jewelry" },
    { name: "Electronics", slug: "electronics" },
    { name: "Apparel", slug: "apparel" },
    { name: "Home & Living", slug: "home-living" },
    { name: "Beauty", slug: "beauty" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-8 py-16 text-center">
      <h1 className="text-3xl font-semibold mb-3">Shop</h1>
      <p className="text-sm text-gray-600 mb-10">
        Browse categories or search for products.
      </p>

      {/* Search */}
      <form
        onSubmit={submit}
        className="flex justify-center gap-2 max-w-[520px] mx-auto mb-14"
      >
        <input
          className="flex-1 border px-4 py-3 text-sm"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="bg-black text-white px-6 text-sm">
          Search
        </button>
      </form>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={`/category/${c.slug}`}
            className="border p-8 hover:border-black transition"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
};
