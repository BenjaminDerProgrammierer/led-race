import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'

export default async function HomePage() {
  let routes: string[];

  try {
    routes = await collectRoutes(path.join(process.cwd(), 'src', 'app'))
  } catch (err) {
    // If reading fails, warn and fall back to root only
    console.warn('Failed to collect routes from src/app:', err)
    routes = ['/']
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>MQTT Open LED Race - All pages</h1>
      <ul>
        {routes.map((r) => (
          <li key={r}>
            <Link href={r} style={{ textDecoration: 'none', color: 'inherit' }}>{r}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

/**
 * Recursively collect all routes from the given directory
 * @param dir Directory to scan
 * @param segments Current path segments
 * @returns Array of route paths
 */
async function collectRoutes(dir: string, segments: string[] = []) {
  const PAGE_FILE_RE = /^page\.(tsx|ts|jsx|js|mdx)$/i
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  const routes = new Set<string>()

  for (const entry of entries) {
    const name = entry.name

    if (name.startsWith('.')) continue

    const fullPath = path.join(dir, name)

    if (entry.isFile() && (PAGE_FILE_RE.test(name))) {
      // handle edge case where segments are <...>/[id]/page.tsx (or similar)
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].startsWith('[') && segments[i].endsWith(']')) {
          // replace with :id
          segments[i] = ':' + segments[i].slice(1, -1)
        }
      }
      const url = '/' + segments.filter(Boolean).join('/')
      routes.add(url || '/')
      continue
    }

    if (!entry.isDirectory()) continue

    const isGroup = name.startsWith('(')
    const newSegments = isGroup ? segments : [...segments, name]

    const childRoutes = await collectRoutes(fullPath, newSegments)
    for (const r of childRoutes) routes.add(r)
  }

  return Array.from(routes).sort((a, b) => a.localeCompare(b))
}