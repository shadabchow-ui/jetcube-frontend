import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import rawCategories from "@/data/_category_urls.json";

/* ---------------------------------------
   Types
--------------------------------------- */

type RawCategory = {
  path: string;
  depth: number;
  parent: string | null;
};

type Department = {
  title: string;
  path: string;
  children: RawCategory[];
};

/* ---------------------------------------
   Helpers
--------------------------------------- */

function titleFromPath(path: string) {
  return path
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function distributeIntoColumns<T>(items: T[], columns: number): T[][] {
  const result: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, index) => {
    result[index % columns].push(item);
  });
  return result;
}

/* ---------------------------------------
   Walmart-style grouping
--------------------------------------- */

function buildDepartments(categories: RawCategory[]): Department[] {
  const departments: Record<string, Department> = {};

  // Depth 1 = department
  for (const cat of categories) {
    if (cat.depth === 1) {
      departments[cat.path] = {
        title: titleFromPath(cat.path),
        path: cat.path,
        children: []
      };
    }
  }

  // Depth 2 = visible subcategories
  for (const cat of categories) {
    if (cat.depth === 2 && cat.parent && departments[cat.parent]) {
      departments[cat.parent].children.push(cat);
    }
  }

  // Sort + cap children (Walmart behavior)
  return Object.values(departments).map(dep => ({
    ...dep,
    children: dep.children
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 10)
  }));
}

/* ---------------------------------------
   Component
--------------------------------------- */

export const ShopHubSection = (): JSX.Element => {
  const departments = useMemo(
    () => buildDepartments(rawCategories as RawCategory[]),
    []
  );

  // Walmart uses column-first layout
  const columns = useMemo(
    () => distributeIntoColumns(departments, 3),
    [departments]
  );

  return (
    <section className="shop-hub">
      <h1 className="shop-hub-title">All Departments</h1>

      <div className="shop-hub-grid">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="shop-hub-column">
            {column.map(dep => (
              <div key={dep.path} className="shop-hub-section">
                <h2 className="shop-hub-heading">
                  <Link to={`/c/${dep.path}`}>{dep.title}</Link>
                </h2>

                <ul className="shop-hub-list">
                  {dep.children.map(child => (
                    <li key={child.path}>
                      <Link to={`/c/${child.path}`}>
                        {titleFromPath(child.path)}
                      </Link>
                    </li>
                  ))}

                  <li className="shop-hub-all">
                    <Link to={`/c/${dep.path}`}>
                      <strong>Shop all {dep.title}</strong>
                    </Link>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ShopHubSection;
