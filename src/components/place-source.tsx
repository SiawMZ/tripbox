import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import { T } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/lib/theme';
import type { Place, TripLink } from '@/lib/types';

/** Where a place came from: the post's cover (a short-lived signed address) and the post itself. */
export type PlaceSource = { cover?: string; url?: string; platform?: string; title?: string };

const PLATFORM: Record<string, string> = {
  xiaohongshu: 'Xiaohongshu',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  x: 'X',
  threads: 'Threads',
  reddit: 'Reddit',
  web: 'Website',
};

/**
 * Each place's source, keyed by place id. Covers are in the private trip-covers bucket, so they are read through
 * signed addresses (one request for the whole trip, valid for an hour).
 */
export function usePlaceSources(places: Place[] | undefined, links: TripLink[] | undefined) {
  const [covers, setCovers] = useState<Record<string, string>>({});
  const paths = (links ?? [])
    .map((l) => l.cover_path)
    .filter((p): p is string => !!p)
    .sort()
    .join('|');

  useEffect(() => {
    if (!paths) return;
    let alive = true;
    void supabase.storage
      .from('trip-covers')
      .createSignedUrls(paths.split('|'), 3600)
      .then(({ data }) => {
        if (!alive || !data) return;
        setCovers(Object.fromEntries(data.flatMap((d) => (d.signedUrl && d.path ? [[d.path, d.signedUrl]] : []))));
      });
    return () => {
      alive = false;
    };
  }, [paths]);

  const byLink = new Map((links ?? []).map((l) => [l.id, l]));
  const out: Record<string, PlaceSource> = {};
  for (const p of places ?? []) {
    const l = p.link_id ? byLink.get(p.link_id) : undefined;
    if (!l) continue;
    out[p.id] = {
      cover: l.cover_path ? covers[l.cover_path] : undefined,
      url: l.url ?? undefined,
      platform: l.platform ? (PLATFORM[l.platform] ?? l.platform) : undefined,
      title: l.title ?? undefined,
    };
  }
  return out;
}

/** The post's cover as the place's thumbnail; a plain square when there's none (typed-in places). */
export function SourceThumb({ source, size = 44 }: { source?: PlaceSource; size?: number }) {
  const c = useColors();
  return source?.cover ? (
    <Image source={{ uri: source.cover }} style={{ width: size, height: size }} contentFit="cover" accessibilityLabel="Cover of the post" />
  ) : (
    <View style={{ width: size, height: size, backgroundColor: c.surface }} />
  );
}

/** "Xiaohongshu · post title ↗": opens the post the place came from. */
export function SourceLink({ source }: { source?: PlaceSource }) {
  if (!source?.url) return null;
  const label = [source.platform, source.title].filter(Boolean).join(' · ') || 'Original post';
  return (
    <T
      variant="small"
      tone="accent"
      numberOfLines={1}
      onPress={() => void Linking.openURL(source.url!)}
      accessibilityRole="link"
      accessibilityLabel={`Open the post: ${label}`}>
      {`${label} ↗`}
    </T>
  );
}
