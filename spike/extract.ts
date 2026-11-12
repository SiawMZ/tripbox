// Step 1 of the spike: posts -> places.
//   deno task extract                 reads spike/posts.txt
//   deno task extract --images=always also reads images when the text already names places
// Writes out/places.json (for the planner) and out/places.csv (mark the `correct` column by hand).

import Anthropic from 'npm:@anthropic-ai/sdk@0.134';
import { parseArgs } from 'jsr:@std/cli@1/parse-args';

import { readPost } from './lib/post.ts';
import { extractPlaces, usageCost, type ExtractResult, type PlaceType } from './lib/extract.ts';
import { matchPlace, type MatchedPlace } from './lib/places.ts';

const args = parseArgs(Deno.args, { string: ['images', 'input'], default: { images: 'auto', input: 'posts.txt' } });
const imagesMode = args.images as 'auto' | 'always' | 'never';
const here = new URL('.', import.meta.url);
const path = (p: string) => new URL(p, here);

const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
if (!Deno.env.get('ANTHROPIC_API_KEY')) {
  console.error('Set ANTHROPIC_API_KEY in spike/.env (see .env.example).');
  Deno.exit(1);
}
if (!googleKey) console.warn('No GOOGLE_MAPS_API_KEY: places are extracted but not matched on the map.\n');

export type PlaceRow = {
  post_url: string;
  platform: string;
  city: string;
  name: string;
  name_local: string;
  area: string;
  type: PlaceType;
  confidence: string;
  match: MatchedPlace | null;
};

// Each line: a URL, optionally followed by a tab or " | " and text pasted from the post or a screenshot.
const lines = (await Deno.readTextFile(path(args.input)))
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

await Deno.mkdir(path('cache/posts'), { recursive: true });
await Deno.mkdir(path('cache/places'), { recursive: true });
await Deno.mkdir(path('out'), { recursive: true });

const client = new Anthropic();
const rows: PlaceRow[] = [];
const stats = { posts: 0, blocked: 0, withImages: 0, images: 0, input: 0, output: 0, cost: 0, placesCalls: 0 };

for (const line of lines) {
  const [url, extraText] = line.split(/\t| \| /, 2);
  stats.posts++;
  console.log(`[${stats.posts}/${lines.length}] ${url}`);

  // Cached by post + mode, so re-running after a fix costs nothing for posts already read.
  const cacheFile = path(`cache/posts/${await hash(`${imagesMode}|${line}`)}.json`);
  let cached: { result: ExtractResult; platform: string; blocked: boolean } | null = null;
  try {
    cached = JSON.parse(await Deno.readTextFile(cacheFile));
  } catch { /* not cached yet */ }

  if (!cached) {
    const post = await readPost(url);
    const result =
      post.blocked && !extraText
        ? { city: '', places: [], usage: { input: 0, output: 0, calls: 0, images: 0 }, readImages: false }
        : await extractPlaces(client, post, { images: imagesMode, extraText });
    cached = { result, platform: post.platform, blocked: post.blocked };
    await Deno.writeTextFile(cacheFile, JSON.stringify(cached, null, 2));
    stats.input += result.usage.input;
    stats.output += result.usage.output;
    stats.cost += usageCost(result.usage);
    stats.images += result.usage.images;
  }
  const { result } = cached;
  if (cached.blocked) stats.blocked++;
  if (result.readImages) stats.withImages++;
  console.log(
    `  ${cached.blocked ? 'BLOCKED ' : ''}${result.places.length} places${result.readImages ? ' (read images)' : ''}` +
      (result.usage.calls ? `, ${result.usage.input}+${result.usage.output} tokens, US$${usageCost(result.usage).toFixed(5)}` : ' (cached)'),
  );

  for (const p of result.places) {
    let match: MatchedPlace | null = null;
    if (googleKey) {
      const query = [p.name_local || p.name, p.area, result.city].filter(Boolean).join(' ');
      const placeCache = path(`cache/places/${await hash(query)}.json`);
      try {
        match = JSON.parse(await Deno.readTextFile(placeCache));
      } catch {
        try {
          match = await matchPlace(query, googleKey);
          stats.placesCalls++;
          await Deno.writeTextFile(placeCache, JSON.stringify(match));
        } catch (e) {
          console.warn('  match failed:', e instanceof Error ? e.message : e);
        }
      }
    }
    console.log(`  - ${p.name_local || p.name} (${p.type}, ${p.confidence}) -> ${match ? match.name : 'no match'}`);
    rows.push({ post_url: url, platform: cached.platform, city: result.city, ...p, match });
  }
}

await Deno.writeTextFile(path('out/places.json'), JSON.stringify(rows, null, 2));
const csv = [
  ['correct', 'post_url', 'city', 'extracted', 'local_name', 'type', 'confidence', 'matched_name', 'address', 'maps_url'],
  ...rows.map((r) => [
    '',
    r.post_url,
    r.city,
    r.name,
    r.name_local,
    r.type,
    r.confidence,
    r.match?.name ?? '',
    r.match?.address ?? '',
    r.match?.mapsUrl ?? '',
  ]),
]
  .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
  .join('\n');
// BOM so Excel opens the Chinese names correctly.
await Deno.writeTextFile(path('out/places.csv'), '﻿' + csv);

const matched = rows.filter((r) => r.match).length;
console.log(`
Posts read:        ${stats.posts} (${stats.blocked} blocked, ${stats.withImages} needed images)
Places found:      ${rows.length} (${matched} matched on the map)
AI this run:       ${stats.input.toLocaleString()} input + ${stats.output.toLocaleString()} output tokens, ${stats.images} images, US$${stats.cost.toFixed(4)}
AI per post:       US$${(stats.cost / Math.max(1, stats.posts - stats.blocked)).toFixed(5)} (new posts only; cached posts cost 0)
Google Places:     ${stats.placesCalls} Text Search calls this run (check the price per call on Google's pricing page)
Check by hand:     open spike/out/places.csv, put y/n in "correct", then count the share of y.`);

async function hash(s: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}
