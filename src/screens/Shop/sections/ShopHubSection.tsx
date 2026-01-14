import { useEffect, useMemo, useState } from "react";

type CategoryRow = {
  url: string;
  path: string;
  depth: number;
  parent: string | null;
  product_count: number;
};

type DeptBlock = {
  slug: string;
  name: string;
  url: string;
  count: number;
  children: CategoryRow[];
};

function titleize(slug: string) {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ShopHubSection() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/indexes/_category_urls.json")
      .then(r => r.json())
      .then(data => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const departments = useMemo<DeptBlock[]>(() => {
    if (!rows.length) return [];

    const deptMap = new Map<string, DeptBlock>();

    // 1️⃣ departments (depth = 1)
    rows
      .filter(r => r.depth === 1)
      .forEach(r => {
        deptMap.set(r.path, {
          slug: r.path,
          name: titleize(r.path),
          url: r.url,
          count: r.product_count,
          children: [],
        });
      });

    // 2️⃣ subcategories (depth = 2)
    rows
      .filter(r => r.depth === 2 && r.parent)
      .forEach(r => {
        const parent = deptMap.get(r.parent);
        if (parent) {
          parent.children.push(r);
        }
      });

    // sort subcategories by popularity
    deptMap.forEach(d => {
      d.children.sort((a, b) => b.product_count - a.product_count);
    });

    // sort departments by popularity
    return Array.from(deptMap.values()).sort(
      (a, b) => b.count - a.count
    );
  }, [rows]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading categories…</div>;
  }

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Shop by Department</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => (
          <div
            key={dept.slug}
            className="border rounded-lg p-5 bg-white"
          >
            <a
              href={dept.url}
              className="text-lg font-semibold hover:underline"
            >
              {dept.name}
            </a>

            <ul className="mt-3 space-y-1">
              {dept.children.slice(0, 6).map(child => (
                <li key={child.path}>
                  <a
                    href={child.url}
                    className="text-sm text-blue-700 hover:underline"
                  >
                    {titleize(child.path.split("/").slice(-1)[0])}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={dept.url}
              className="inline-block mt-4 text-sm font-medium text-black hover:underline"
            >
              View all
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
