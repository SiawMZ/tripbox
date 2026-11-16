import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';

import { detectPlatform } from '../../supabase/functions/_shared/url';

/**
 * Reads a Xiaohongshu post on the phone and returns its page and first pictures for the import function.
 *
 * Since 2026-11 Xiaohongshu drops requests from Supabase's servers (they time out), while it still answers phones.
 * So the Android app fetches the post itself, the way a browser would, and the function reads what it sends (and
 * checks it: Xiaohongshu addresses only, real images only, size limits). Browsers can't do this (a website may not
 * read another site's pages), so on the web this returns null and the function tries on its own.
 */

export type DevicePage = { url: string; html: string; images: { url: string; type: string; base64: string }[] };

const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const MAX_HTML = 1_500_000;
const MAX_IMAGE = 5_000_000;
const MAX_IMAGES = 4;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function readsOnDevice(url: string) {
  return Platform.OS !== 'web' && detectPlatform(url) === 'xiaohongshu';
}

/** Null when the post can't be read here (the function then tries itself). Never throws. */
export async function readPostOnDevice(url: string): Promise<DevicePage | null> {
  if (!readsOnDevice(url)) return null;
  try {
    // xhslink.com (the short links shared from the app) is sometimes slow from outside China: try twice.
    const open = () => withTimeout(expoFetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en,zh;q=0.8' } }), 12_000);
    const res = await open().catch(() => open());
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return null;
    const html = (await res.text()).slice(0, MAX_HTML);
    const finalUrl = res.url || url;
    if (detectPlatform(finalUrl) !== 'xiaohongshu') return null; // a login or bot-check page elsewhere
    const images: DevicePage['images'] = [];
    for (const src of pictureAddresses(html).slice(0, MAX_IMAGES)) {
      const img = await download(src);
      if (img) images.push(img);
    }
    return { url: finalUrl, html, images };
  } catch {
    return null;
  }
}

/**
 * The post's pictures, in carousel order. Xiaohongshu's pages have changed shape before, so this takes every
 * source: the og:image tags (one per picture on rednote.com since 2026-11), the page data's imageList, and the
 * older "urlDefault" entries. Addresses are signed and short-lived, which is fine: they're downloaded right away.
 */
function pictureAddresses(html: string) {
  const unescape = (s: string) => {
    try {
      return JSON.parse(`"${s}"`) as string;
    } catch {
      return s;
    }
  };
  const og = [...html.matchAll(/<meta[^>]+(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/gi)].map((m) =>
    m[1].replace(/&amp;/g, '&'),
  );
  const list = [...html.matchAll(/"imageList":\[\{"url":"((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1]));
  const urlDefault = [...html.matchAll(/"urlDefault":"((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1]));
  return [...new Set([...og, ...list, ...urlDefault].map((s) => s.replace(/^http:/, 'https:')))].filter((s) => /^https:\/\//i.test(s));
}

async function download(src: string) {
  try {
    const res = await withTimeout(expoFetch(src, { headers: { 'User-Agent': UA } }), 15_000);
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!res.ok || !IMAGE_TYPES.includes(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_IMAGE) return null;
    return { url: src, type, base64: toBase64(bytes) };
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timed out')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
