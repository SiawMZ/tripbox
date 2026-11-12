// One small Google Maps photo per place, downloaded once into out/photos/ so the browser never needs
// the API key. Shared by `deno task photos` and the import server.

export type PhotoEntry = { file: string; credit?: string } | { none: true };

/** Downloads the place's first photo. Returns null when the request failed (try again later). */
export async function downloadPhoto(placeId: string, apiKey: string, dir: URL): Promise<PhotoEntry | null> {
  // Place Details with only the photos field: the photo's resource name and its author.
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
  });
  if (!res.ok) return null;
  const photo = (await res.json()).photos?.[0];
  if (!photo?.name) return { none: true };
  // skipHttpRedirect returns the image address as JSON instead of redirecting to it.
  const meta = await fetch(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=240&skipHttpRedirect=true`,
    { headers: { 'X-Goog-Api-Key': apiKey } },
  );
  const uri = meta.ok ? (await meta.json()).photoUri : null;
  const img = uri ? await fetch(uri) : null;
  if (!img?.ok) return null;
  const file = `${placeId}.jpg`;
  await Deno.writeFile(new URL(file, dir), new Uint8Array(await img.arrayBuffer()));
  return { file, credit: photo.authorAttributions?.[0]?.displayName };
}

export async function readPhotoIndex(dir: URL): Promise<Record<string, PhotoEntry>> {
  try {
    return JSON.parse(await Deno.readTextFile(new URL('index.json', dir)));
  } catch {
    return {};
  }
}

export async function writePhotoIndex(dir: URL, index: Record<string, PhotoEntry>) {
  await Deno.writeTextFile(new URL('index.json', dir), JSON.stringify(index, null, 2));
}
