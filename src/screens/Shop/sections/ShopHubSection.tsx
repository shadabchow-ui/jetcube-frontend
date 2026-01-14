import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import rawCategories from '@/data/_category_urls.json'

/* ---------------------------------------
   Types
--------------------------------------- */

type RawCategory = {
  url: string
  path: string
  depth: number
  parent: string | null
  product_count: number
}

type CategoryNode = {
  title: string
  url: string
  path: string
  depth: number
  product_count: number
  children: CategoryNode[]
}

/* ---------------------------------------
   Helpers
--------------------------------------- */

function titleFromPath(path: string) {
  return path
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function normalizePath(path: string) {
  return path
    .replace(/-and-/g, '-')
    .replace(/&/g, '')
    .replace(/--+/g, '-')
    .toLowerCase()
}

/* ---------------------------------------
   Hierarchy Builder
--------------------------------------- */

function buildCategoryTree(categories: RawCategory[]): CategoryNode[] {
  const byPath = new Map<string, CategoryNode>()
  const byUrl = new Map<string, CategoryNode>()
  const roots: CategoryNode[] = []

  const sorted = [...categories].sort((a, b) => a.depth - b.depth)

  for (const cat of sorted) {
    const normPath = normalizePath(cat.path)

    // Deduplicate
    if (byPath.has(normPath)) {
      byPath.get(normPath)!.product_count += cat.product_count
      continue
    }

    const node: CategoryNode = {
      title: titleFromPath(cat.path),
      url: cat.url,
      path: cat.path,
      depth: cat.depth,
      product_count: cat.product_count,
      children: []
    }

    // Parent resolution
    if (cat.parent) {
      const parentNorm = normalizePath(cat.parent)
      if (byPath.has(parentNorm)) {
        byPath.get(parentNorm)!.children.push(node)
      } else {
        roots.push(node)
      }
    } else if (cat.depth === 1) {
      roots.push(node)
    } else {
      // Fallback: URL prefix
      const parent = [...byUrl.values()]
        .filter(p => cat.url.startsWith(p.url + '/'))
        .sort((a, b) => b.url.length - a.url.length)[0]

      if (parent) parent.children.push(node)
      else roots.push(node)
    }

    byPath.set(normPath, node)
    byUrl.set(cat.url, node)
  }

  return roots
}

/* ---------------------------------------
   Component
--------------------------------------- */

const ShopHubSection: React.FC = () => {
  const sections = useMemo(
    () => buildCategoryTree(rawCategories as RawCategory[]),
    []
  )

  return (
    <section className="shop-hub">
      <h1 className="shop-hub-title">All Departments</h1>

      <div className="shop-hub-grid">
        {sections.map(section => (
          <div key={section.url} className="shop-hub-column">
            <Link to={section.url} className="shop-hub-heading">
              {section.title}
            </Link>

            {section.children.length > 0 && (
              <ul className="shop-hub-list">
                {section.children.map(sub => (
                  <li key={sub.url}>
                    <Link to={sub.url} className="shop-hub-link">
                      {sub.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export { ShopHubSection }
export default ShopHubSection

