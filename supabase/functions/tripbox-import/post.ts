// Reads a saved post (Xiaohongshu, Instagram, TikTok, YouTube, web) into text + image URLs.
// From Linkbox's enrich function (preview code and safe fetching), extended to keep every image of an
// XHS carousel and the body text of web articles (place names are often in both).

import { detectPlatform, type Platform } from '../_shared/url.ts';

const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
// Meta (Instagram, Facebook, Threads) serves Open Graph tags to its own crawler without a login wall.
const CRAWLER_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const META_PLATFORMS = new Set<Platform>(['instagram', 'facebook', 'threads']);

const MAX_HTML_BYTES = 1_500_000;
const MAX_IMAGE_BYTES = 5_000_000;
const MAX_REDIRECTS = 5;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

export type Post = {
  url: string;
  resolvedUrl: string;
  platform: Platform;
  /** Bot check, login wall or private address: nothing useful was read. */
  blocked: boolean;
  title?: string;
  text?: string;
  author?: string;
  images: string[];
};

export async function readPost(url: string): Promise<Post> {
  const platform = detectPlatform(url);
  const ua = META_PLATFORMS.has(platform) ? CRAWLER_UA : BROWSER_UA;
  const post: Post = { url, resolvedUrl: url, platform, blocked: false, images: [] };
  try {
    const { res, url: finalUrl } = await safeFetch(url, {
      headers: { 'User-Agent': ua, 'Accept-Language': 'en,zh;q=0.8' },
      signal: AbortSignal.timeout(15_000),
    });
    const realPlatform = platform === 'web' ? detectPlatform(finalUrl) : platform;
    post.platform = realPlatform;
    post.blocked =
      (platform !== 'web' && detectPlatform(finalUrl) !== platform) || isLoginPage(finalUrl);
    post.resolvedUrl = finalUrl;
    if (post.blocked || !res.ok || !(res.headers.get('content-type') ?? '').includes('html')) {
      res.body?.cancel().catch(() => {});
      if (!res.ok) post.blocked = true;
      return post;
    }
    const html = await readLimited(res, MAX_HTML_BYTES);
    const meta = parseMeta(html, finalUrl);
    const xhs = realPlatform === 'xiaohongshu' ? parseXiaohongshuState(html) : {};
    post.title = xhs.title ?? meta.title;
    post.text = xhs.text ?? meta.description;
    post.author = xhs.author ?? meta.author;
    post.images = [...new Set([...(xhs.images ?? []), ...(meta.images ?? [])])];
    // Web articles: the body text often names the places that og:description leaves out.
    if (realPlatform === 'web') post.text = [post.text, pageText(html)].filter(Boolean).join('\n\n');
  } catch (e) {
    post.blocked = true;
    console.warn('  page fetch failed:', e instanceof Error ? e.message : e);
  }
  // YouTube and TikTok pages carry no post data for bots; their public oEmbed gives the real title.
  const oembed = await fetchOEmbed(post.platform, post.resolvedUrl);
  if (oembed) {
    post.title = oembed.title || post.title;
    post.author = oembed.author || post.author;
    if (post.text === 'Share your videos with friends, family, and the world') post.text = undefined;
    if (oembed.image) post.images = [oembed.image, ...post.images];
    post.blocked = false;
  }
  return post;
}

async function fetchOEmbed(platform: Platform, url: string) {
  const endpoint =
    platform === 'tiktok'
      ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      : platform === 'youtube'
        ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
        : null;
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title as string | undefined,
      author: data.author_name as string | undefined,
      image: data.thumbnail_url as string | undefined,
    };
  } catch {
    return null;
  }
}

/** Downloads an image for the AI. Returns null for non-raster or oversized images. */
export async function downloadImage(url: string): Promise<{ type: ImageType; base64: string } | null> {
  const got = await downloadImageBytes(url);
  return got ? { type: got.type, base64: toBase64(got.bytes) } : null;
}

/** Downloads a raster image (safe fetching, 5 MB cap). Null if it isn't one or can't be fetched. */
export async function downloadImageBytes(url: string): Promise<{ type: ImageType; bytes: Uint8Array } | null> {
  try {
    const { res } = await safeFetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(15_000),
    });
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!res.ok || !(IMAGE_TYPES as readonly string[]).includes(type)) {
      res.body?.cancel().catch(() => {});
      return null;
    }
    const { bytes, truncated } = await readBytes(res, MAX_IMAGE_BYTES);
    if (truncated) return null;
    return { type: type as ImageType, bytes };
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function parseMeta(html: string, baseUrl: string) {
  const head = html.slice(0, 300_000);
  const meta = (names: string[]) => {
    for (const name of names) {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
        'i',
      );
      const m = head.match(re);
      const value = m?.[1] ?? m?.[2];
      if (value?.trim()) return decodeEntities(value.trim());
    }
    return undefined;
  };
  const titleTag = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const images = ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image']
    .map((name) => meta([name]))
    .filter((u): u is string => !!u)
    .flatMap((u) => {
      try {
        return [new URL(u, baseUrl).toString()];
      } catch {
        return [];
      }
    });
  return {
    title: meta(['og:title', 'twitter:title']) ?? (titleTag ? decodeEntities(titleTag.trim()) : undefined),
    description: meta(['og:description', 'twitter:description', 'description']),
    author: meta(['author', 'article:author', 'og:site_name']),
    images,
  };
}

/** Visible text of an article, capped so one long page can't become a large bill. */
function pageText(html: string) {
  // The article itself, not the site's menus: <article>, else <main>, else the whole page minus nav/header/footer.
  const cleaned = html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, ' ');
  const part =
    cleaned.match(/<article\b[\s\S]*<\/article>/i)?.[0] ?? cleaned.match(/<main\b[\s\S]*<\/main>/i)?.[0] ?? cleaned;
  return decodeEntities(part.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 15000);
}

/** The note in Xiaohongshu's `window.__INITIAL_STATE__` JSON: title, full text and every image. */
function parseXiaohongshuState(html: string): { title?: string; text?: string; author?: string; images?: string[] } {
  const start = html.indexOf('__INITIAL_STATE__');
  if (start === -1) return {};
  const state = html.slice(start);
  const unescape = (raw: string) => {
    try {
      return (JSON.parse(`"${raw}"`) as string).trim() || undefined;
    } catch {
      return undefined;
    }
  };
  const str = (re: RegExp) => {
    const m = state.match(re);
    return m?.[1] ? unescape(m[1]) : undefined;
  };
  // One "urlDefault" per carousel image; the first 9 belong to the note itself.
  const images = [...state.matchAll(/"urlDefault":"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => unescape(m[1]))
    .filter((u): u is string => !!u)
    .map((u) => u.replace(/^http:/, 'https:'));
  return {
    title: str(/"title":"((?:[^"\\]|\\.)+)","interactInfo"/) ?? str(/"title":"((?:[^"\\]|\\.)+)"/),
    text: str(/"desc":"((?:[^"\\]|\\.)+)"/),
    author: str(/"nickname":"((?:[^"\\]|\\.)+)"/),
    images: [...new Set(images)].slice(0, 9),
  };
}

function isLoginPage(url: string) {
  try {
    return /^\/(login|accounts\/login|signin)\b/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function decodeEntities(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

async function readLimited(res: Response, limit: number): Promise<string> {
  const { bytes } = await readBytes(res, limit);
  return new TextDecoder().decode(bytes);
}

async function readBytes(res: Response, limit: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) return { bytes: new Uint8Array(), truncated: false };
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    if (size > limit) {
      truncated = true;
      break;
    }
  }
  reader.cancel().catch(() => {});
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  return { bytes: all.subarray(0, Math.min(size, limit)), truncated };
}

class BlockedUrlError extends Error {}

/**
 * fetch() for addresses that come from users or pages. Only http(s) on the default ports, never a
 * private, loopback or link-local address (checked after DNS and again on every redirect), and at
 * most MAX_REDIRECTS redirects, so the function can't be used to reach internal services.
 */
async function safeFetch(input: string, init: RequestInit = {}): Promise<{ res: Response; url: string }> {
  let url = input;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const res = await fetch(url, { ...init, redirect: 'manual' });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (!location) return { res, url };
    res.body?.cancel().catch(() => {});
    url = new URL(location, url).toString();
  }
  throw new Error('too many redirects');
}

async function assertPublicUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new BlockedUrlError('invalid url');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new BlockedUrlError(`scheme ${u.protocol}`);
  if (u.port && u.port !== '80' && u.port !== '443') throw new BlockedUrlError(`port ${u.port}`);
  if (u.username || u.password) throw new BlockedUrlError('credentials in url');
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  const ipLiteral = isIPv4(host) || host.includes(':');
  if (!ipLiteral && (!host.includes('.') || /(^|\.)(localhost|local|internal|lan|home\.arpa)$/.test(host))) {
    throw new BlockedUrlError(`host ${host}`);
  }
  const addresses = ipLiteral ? [host] : await resolveHost(host);
  if (addresses.some(isPrivateIp)) throw new BlockedUrlError(`private address for ${host}`);
}

/** A and AAAA records. With no answer the fetch fails by itself, so that case isn't an error here. */
async function resolveHost(host: string): Promise<string[]> {
  const lookups = await Promise.allSettled([Deno.resolveDns(host, 'A'), Deno.resolveDns(host, 'AAAA')]);
  return lookups.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

function isIPv4(s: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
}

function isPrivateIp(ip: string): boolean {
  if (isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 || // multicast, reserved
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local, cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  const embedded = v6.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (embedded) return isPrivateIp(embedded);
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('::ffff:') || // IPv4-mapped in hex form
    v6.startsWith('64:ff9b:') || // NAT64
    /^f[cd]/.test(v6) || // unique local
    /^fe[89ab]/.test(v6) || // link-local
    v6.startsWith('ff') // multicast
  );
}
