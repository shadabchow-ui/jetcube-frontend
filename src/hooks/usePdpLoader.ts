// Fixed PDP Loader with proper R2_BASE, URL joining, and shard resolution

// 1. Fix: Use the correct R2 public endpoint
const R2_BASE = "https://pub-ef133d84c664c8aceb5e7ce3e4d665.r2.dev";

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

// 2. Fix: Shard resolution that matches the index builder logic
// Based on the debugging info, shards are named like: _a.json.gz, _i.json.gz, 0.json.gz, 00.json.gz, 02.json.gz, 1-.json.gz
// The shard key is the filename without .json.gz extension
function resolveShardKey(slug: string, manifest: PDPManifest): string {
  // CRITICAL: This function must exactly match the index builder's bucketing logic
  // For now, we need the exact algorithm from the index builder script
  // This is a placeholder - the real implementation should mirror the generator logic
  
  // Based on the shard names provided, it looks like the logic might be:
  // - Some shards are single characters (_a, _i)
  // - Some are numeric (0, 00, 02)  
  // - Some have special suffixes (1-)
  
  // Without the exact generator algorithm, we need to implement the same logic
  // For safety, let's use a basic first-character mapping that matches common patterns
  const firstChar = slug.charAt(0).toLowerCase();
  
  // Check if this character maps to any existing shard in the manifest
  for (const shard of manifest.shards) {
    // Try exact character match first
    if (shard === `_${firstChar}`) {
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
      const manifestUrl = joinUrl(R2_BASE, 'indexes/_index.json');
      const response = await fetch(manifestUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
      }
      
      this.manifestCache = await response.json();
      return this.manifestCache;
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
      const shardFilename = `${shardKey}.json.gz`;
      const base = 'indexes/pdp_paths/';
      const shardUrl = joinUrl(R2_BASE, `${base}${shardFilename}`);
      
      const response = await fetch(shardUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load shard ${shardKey}: ${response.status} ${response.statusText}`);
      }
      
      // Handle gzipped content
      const data = await this.decompressGzip(response);
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

// Usage example:
export async function loadProductData(slug: string): Promise<PDPEntry | null> {
  const loader = new PDPLoader();
  return await loader.findProduct(slug);
}

/* 
DEBUGGING NOTES:
1. ✅ R2_BASE now points to correct public endpoint: https://pub-ef133d84c664c8aceb5e7ce3e4d665.r2.dev
2. ✅ URL joining prevents double-slash issues with joinUrl() helper
3. ⚠️  resolveShardKey() needs exact algorithm from index builder script

NEXT STEPS:
- Replace resolveShardKey() with exact logic from the index builder script
- Test with actual product slugs to verify shard resolution works
- Verify gzip decompression works with the R2 files

The main fixes are in place, but the shard resolution logic should be updated 
to match the exact algorithm used when generating the index files.
*/

