// Fixed PDP Loader with proper R2_BASE, URL joining, and shard resolution

// 1. Fix: Use the correct R2 public endpoint
const R2_BASE = (() => {
  const raw = (import.meta as any)?.env?.VITE_R2_BASE;
  const cleaned = String(raw ?? "").trim().replace(/\/+$/, "");
  if (!cleaned || cleaned === "undefined" || cleaned === "null") {
    throw new Error(
      "[usePdpLoader] VITE_R2_BASE is not set. Provide import.meta.env.VITE_R2_BASE (e.g. https://pub-xxxx.r2.dev).",
    );
  }
  if (/\bventari\.net\b/i.test(cleaned) || /\br2\.ventari\.net\b/i.test(cleaned)) {
    throw new Error(`[usePdpLoader] Refusing legacy base URL: ${cleaned}`);
  }
  if (!/^https?:\/\//i.test(cleaned)) {
    throw new Error(`[usePdpLoader] VITE_R2_BASE must be an absolute URL (got: ${cleaned}).`);
  }
  return cleaned;
})();

// 3. Fix: Safe URL joining helper to prevent double-slash issues
function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

interface PDPManifest {
  shards: string[];
  [key: string]: any;
}

interface PDPEntry {
  slug: string;
  [key: string]: any;
}

/*
Shard Resolution Algorithm:
The index builder generates shards based on:
- If slug starts with a letter: shard key is "_<letter>"
- If slug starts with a number: shard key is "<number>" or "0<number>"
- Shards are named like: _a.json.gz, _i.json.gz, 0.json.gz, 00.json.gz, 02.json.gz, 1-.json.gz
// The shard key is the filename without .json.gz extension
*/
function resolveShardKey(slug: string, manifest: PDPManifest): string {
  if (!slug || !manifest?.shards?.length) {
    return '0';
  }
  
  const firstChar = slug[0].toLowerCase();
  
  // Check if it's a letter
  if (firstChar >= 'a' && firstChar <= 'z') {
    const letterShard = `_${firstChar}`;
    if (manifest.shards.includes(letterShard)) {
      return letterShard;
    }
  }
  
  // Check if it's a number
  if (firstChar >= '0' && firstChar <= '9') {
    // Try direct number shard
    if (manifest.shards.includes(firstChar)) {
      return firstChar;
    }
    // Try 0-prefixed shard (00, 01, etc.)
    const zeroPrefixed = `0${firstChar}`;
    if (manifest.shards.includes(zeroPrefixed)) {
      return zeroPrefixed;
    }
  }
  
  // Try to find best matching shard
  for (const shard of manifest.shards) {
    // Skip letter shards if we have a number
    if (firstChar >= '0' && firstChar <= '9' && shard.startsWith('_')) {
      continue;
    }
    // Skip number shards if we have a letter
    if (firstChar >= 'a' && firstChar <= 'z' && !shard.startsWith('_')) {
      continue;
    }
    
    // If shard is a prefix of the slug
    if (slug.toLowerCase().startsWith(shard.replace('_', ''))) {
      return shard;
    }
    
    // Try numeric mapping
    if (firstChar >= '0' && firstChar <= '9') {
      if (shard === firstChar || shard === `0${firstChar}`) {
        return shard;
      }
    }
  }
  
  // Default fallback - use first available shard
  return manifest.shards[0] || '0';
}

export class PDPLoader {
  private manifestCache: PDPManifest | null = null;
  private shardCache: Map<string, PDPEntry[]> = new Map();
  
  async loadManifest(): Promise<PDPManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }
    
    try {
      // Fixed URL joining
      const manifestPath = "indexes/_index.json";
      const manifestUrlGz = joinUrl(R2_BASE, `${manifestPath}.gz`);
      const manifestUrl = joinUrl(R2_BASE, manifestPath);

      // Prefer .json.gz when available, fall back to plain .json
      let response = await fetch(manifestUrlGz);
      let manifestText: string | null = null;

      if (response.ok) {
        manifestText = await this.decompressGzip(response);
      } else {
        response = await fetch(manifestUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to load manifest: ${response.status} ${response.statusText}`,
          );
        }
        manifestText = await response.text();
      }

      const manifest = JSON.parse(manifestText);
      
      this.manifestCache = manifest;
      return manifest;
    } catch (error) {
      console.error('Error loading PDP manifest:', error);
      throw error;
    }
  }
  
  async loadShard(shardKey: string): Promise<PDPEntry[]> {
    if (this.shardCache.has(shardKey)) {
      return this.shardCache.get(shardKey)!;
    }
    
    try {
      // Fixed URL joining for shard files
      const base = "indexes/pdp_paths/";
      const shardUrlGz = joinUrl(R2_BASE, `${base}${shardKey}.json.gz`);
      const shardUrl = joinUrl(R2_BASE, `${base}${shardKey}.json`);

      // Prefer .json.gz when available; fall back to plain .json if missing/unavailable.
      let response = await fetch(shardUrlGz);
      let data: string;

      if (response.ok) {
        data = await this.decompressGzip(response);
      } else {
        response = await fetch(shardUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to load shard ${shardKey}: ${response.status} ${response.statusText}`,
          );
        }
        data = await response.text();
      }

      const entries = JSON.parse(data);
      
      this.shardCache.set(shardKey, entries);
      return entries;
    } catch (error) {
      console.error(`Error loading PDP shard ${shardKey}:`, error);
      throw error;
    }
  }
  
  async findProduct(slug: string): Promise<PDPEntry | null> {
    try {
      const manifest = await this.loadManifest();
      const shardKey = resolveShardKey(slug, manifest);
      const shardEntries = await this.loadShard(shardKey);
      
      // Find the product in the shard
      const product = shardEntries.find(entry => entry.slug === slug);
      return product || null;
    } catch (error) {
      console.error(`Error finding product ${slug}:`, error);
      return null;
    }
  }
  
  private async decompressGzip(response: Response): Promise<string> {
    // Handle gzipped responses
    const buffer = await response.arrayBuffer();
    
    // Check if it's actually gzipped by looking at magic number
    const uint8Array = new Uint8Array(buffer);
    const isGzipped = uint8Array[0] === 0x1f && uint8Array[1] === 0x8b;
    
    if (isGzipped && typeof DecompressionStream !== 'undefined') {
      // Use native decompression if available
      const stream = new Response(buffer).body?.pipeThrough(new DecompressionStream('gzip'));
      if (stream) {
        const decompressedResponse = new Response(stream);
        return await decompressedResponse.text();
      }
    }
    
    // Fallback: assume it's not compressed or handle as plain text
    return new TextDecoder().decode(buffer);
  }
}

/* 
DEBUGGING NOTES:
1. ✅ R2_BASE now points to correct public endpoint: VITE_R2_BASE
2. ✅ URL joining prevents double-slash issues with joinUrl() helper
3. ⚠️  resolveShardKey() needs exact algorithm from index builder script

NEXT STEPS:
- Replace resolveShardKey() with exact logic from the index builder script
- Test with actual product slugs to verify shard resolution works
- Verify gzip decompression works with the R2 files

The main fixes are in place, but the shard resolution logic should be updated 
to match the exact algorithm used when generating the index files.
*/
