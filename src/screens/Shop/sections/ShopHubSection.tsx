import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import rawCategories from "@/data/_category_urls.json";
import "./ShopHubSection.css";

/* ---------------------------------------
   Types
--------------------------------------- */

type RawCategory = {
  path: string;          // e.g. "Automotive/oils And Fluids"
  depth: number;         // 1 = department, 2 = subcategory
  parent: string | null; // e.g. "Automotive"
};

type Department = {
  title: string;
  path: string;          // raw parent path, e.g. "Automotive"
  children: RawCategory[];
};

/* ---------------------------------------
   Helpers
--------------------------------------- */

// Convert raw path to URL-safe slug
function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/&/g, "and")
    .replace(/--+/g, "-")
    .replace(/\//g, "/")
    .trim();
}

// Convert slug/path to Title Case
function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Remove parent prefix from child display label
function childTitle(childPath: string, parentPath: string) {
  const cleaned = childPath.replace(
    new RegExp(`^${parentPath}/`, "i"),
    ""
  );

  return cleaned
    .split(/[-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Distribute departments into N columns (Walmart-style)
function distributeIntoColumns<T>(items: T[], columns: number): T[][] {
  const result: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, index) => {
    result[index % columns].push(item);
  });
  return result;
}

/* ---------------------------------------
   Build Walmart-style departments
--------------------------------------- */

function buildDepartments(categories: RawCategory[]): Department[] {
  const departments: Record<string, Department> = {};

  // Depth 1 → top-level departments
  for (const cat of categories) {
    if (cat.depth === 1) {
      departments[cat.path] = {
        title: titleFromSlug(normalizeSlug(cat.path)),
        path: cat.path,
        children: []
      };
    }
  }

  // Depth 2 → visible subcategories
  for (const cat of categories) {
    if (cat.depth === 2 && cat.parent && departments[cat.parent]) {
      departments[cat.parent].children.push(cat);
    }
  }

  // Sort + cap children (Walmart density)
  return Object.values(departments).map(dep => ({
    ...dep,
    children: dep.children
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 7)
  }));
}

/* ---------------------------------------
   Component
--------------------------------------- */

export const ShopHubSection = (): JSX.Element => {
  const departments = useMemo(
    () =>
      buildDepartments(rawCategories as RawCategory[]).sort((a, b) =>
        a.title.localeCompare(b.title)
      ),
    []
  );

  // Walmart-style column layout
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
                  <Link to={`/c/${normalizeSlug(dep.path)}`}>
                    {dep.title}
                  </Link>
                </h2>

                <ul className="shop-hub-list">
                  {dep.children.map(child => (
                    <li key={child.path}>
                      <Link to={`/c/${child.path}`}>
                        {childTitle(child.path, dep.path)}
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

