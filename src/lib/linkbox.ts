import { normalizeUrl } from '../../supabase/functions/_shared/url';
import { supabase } from './supabase';

/**
 * Read-only access to the traveller's Linkbox folders, for importing a folder's posts into a trip. Tripbox and
 * Linkbox share one Supabase project and one login, so this reads Linkbox's tables with the user's own session:
 * Linkbox's row level security returns only their own folders and links, and Linkbox's get_collab_folders /
 * get_joined_links return the shared folders they joined (public fields only). Tripbox never writes to them.
 */

export type LinkboxFolder = { id: string; name: string; shared: boolean; ownerName?: string };

export type LinkboxPost = {
  id: string;
  url: string;
  normalizedUrl: string;
  platform: string;
  title: string | null;
  thumbnail: string | null;
  addedBy?: string;
  createdAt: string;
};

/** Your Linkbox folders and the shared folders you joined, by name. `null` id = links in no folder. */
export async function linkboxFolders(): Promise<LinkboxFolder[]> {
  const [own, collab] = await Promise.all([
    supabase.from('folders').select('id, name').order('name'),
    supabase.rpc('get_collab_folders'),
  ]);
  if (own.error) throw own.error;
  const out = new Map<string, LinkboxFolder>();
  for (const f of own.data ?? []) out.set(f.id as string, { id: f.id as string, name: f.name as string, shared: false });
  for (const f of (collab.data as { id: string; name: string; role: string; owner_name?: string }[] | null) ?? []) {
    const mine = out.get(f.id);
    out.set(f.id, { id: f.id, name: f.name, shared: true, ownerName: mine ? undefined : f.owner_name });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const thumbnailUrl = (path: string | null) =>
  path ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}` : null;

type Row = {
  id: string;
  url: string;
  normalized_url: string;
  platform: string;
  title: string | null;
  thumbnail_path: string | null;
  folder_id: string | null;
  created_at: string;
  added_by?: string;
};

/** The posts in one Linkbox folder (or in no folder), newest first: yours, plus other members' in a shared folder. */
export async function linkboxPosts(folder: LinkboxFolder | null): Promise<LinkboxPost[]> {
  let q = supabase
    .from('links')
    .select('id, url, normalized_url, platform, title, thumbnail_path, folder_id, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  q = folder ? q.eq('folder_id', folder.id) : q.is('folder_id', null);
  const [own, joined] = await Promise.all([q, folder?.shared ? supabase.rpc('get_joined_links') : Promise.resolve({ data: [] })]);
  if (own.error) throw own.error;
  const rows = [...((own.data as Row[]) ?? []), ...(((joined.data as Row[]) ?? []).filter((r) => r.folder_id === folder?.id))];
  const seen = new Set<string>();
  return rows
    .filter((r) => !seen.has(r.normalized_url) && seen.add(r.normalized_url))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => ({
      id: r.id,
      url: r.url,
      normalizedUrl: normalizeUrl(r.url),
      platform: r.platform,
      title: r.title,
      thumbnail: thumbnailUrl(r.thumbnail_path),
      addedBy: r.added_by,
      createdAt: r.created_at,
    }));
}

/** Same normalisation as Linkbox's, to spot posts already imported into the trip. */
export const sameUrlKey = (url: string) => normalizeUrl(url);
