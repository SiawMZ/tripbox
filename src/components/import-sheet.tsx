import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button, Check, Field, Rule, Sheet, T } from '@/components/ui';
import { addPicked, rateImport, runImport, type Candidate, type ImportEvent, type ImportSource } from '@/lib/importer';
import { linkboxFolders, linkboxPosts, sameUrlKey, type LinkboxFolder, type LinkboxPost } from '@/lib/linkbox';
import { space, useColors } from '@/lib/theme';

const STEPS = [
  ['open', 'Opening the post'],
  ['read', 'Reading its text and pictures'],
  ['find', 'Finding places'],
  ['details', 'Checking each place on the map'],
  ['done', 'Your places are ready'],
] as const;
type StepKey = (typeof STEPS)[number][0];

/** Posts imported in one go; the server's limits (30 imports an hour) still apply to each. */
const MAX_BATCH = 20;

type Review = { linkId: string; source: ImportSource; candidates: Candidate[]; maxKm: number };
type Phase = 'input' | 'folders' | 'posts' | 'working' | 'review';
/** A ticked place: which post (index in reviews) and which of its places. */
const pickKey = (r: number, c: number) => `${r}:${c}`;

/**
 * Paste a link (or pick posts from a Linkbox folder) -> watch the steps -> tick the places to keep -> add them.
 * A folder's posts are imported one after another, then reviewed together.
 */
export function ImportSheet({
  tripId,
  visible,
  importedUrls,
  onClose,
  onAdded,
}: {
  tripId: string;
  visible: boolean;
  /** Links already imported into this trip, to mark posts that would be imported twice. */
  importedUrls: string[];
  onClose: () => void;
  onAdded: (count: number) => void;
}) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [at, setAt] = useState<StepKey>('open');
  const [detail, setDetail] = useState('');
  const [batch, setBatch] = useState<{ done: number; total: number; title?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [rated, setRated] = useState<'good' | 'bad' | null>(null);
  const [adding, setAdding] = useState(false);
  const [folders, setFolders] = useState<LinkboxFolder[] | null>(null);
  const [folder, setFolder] = useState<LinkboxFolder | null>(null);
  const [posts, setPosts] = useState<LinkboxPost[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const imported = new Set(importedUrls.map(sameUrlKey));

  function reset() {
    setUrl('');
    setText('');
    setPhase('input');
    setError(null);
    setFailed([]);
    setReviews([]);
    setPicked(new Set());
    setRated(null);
    setBatch(null);
    setFolder(null);
    setPosts(null);
    setChosen(new Set());
  }

  function close() {
    if (phase === 'working') return; // let the import finish; it is already paid for
    reset();
    onClose();
  }

  /** Ticked by default: found on the map, new to this trip, near the start point, and not ticked in an earlier post. */
  function defaultPicks(all: Review[]) {
    const out = new Set<string>();
    const taken = new Set<string>();
    all.forEach((r, ri) =>
      r.candidates.forEach((c, ci) => {
        if (!c.place_id || c.already || (c.km_away ?? 0) > r.maxKm || taken.has(c.place_id)) return;
        taken.add(c.place_id);
        out.add(pickKey(ri, ci));
      }),
    );
    return out;
  }

  /** Imports links one after another; each post's places wait for the review. */
  async function importAll(items: { url: string; text: string; title?: string }[]) {
    setError(null);
    setFailed([]);
    setPhase('working');
    const done: Review[] = [];
    const errors: string[] = [];
    for (const [i, item] of items.entries()) {
      setBatch(items.length > 1 ? { done: i, total: items.length, title: item.title ?? item.url } : null);
      setAt('open');
      setDetail('');
      let stop = false;
      const label = item.title || item.url || 'Pasted text';
      const onEvent = (e: ImportEvent) => {
        if (e.step === 'error') {
          errors.push(items.length > 1 ? `${label}: ${e.message}` : e.message);
          // A limit (too many imports this hour or day) applies to the rest too.
          if (/limit|too many|try again (later|tomorrow)/i.test(e.message)) stop = true;
        } else if (e.step === 'done') {
          done.push({ linkId: e.link_id, source: e.source, candidates: e.candidates, maxKm: e.max_km });
        } else {
          setAt(e.step === 'find' && e.count ? 'details' : e.step);
          setDetail(e.step === 'find' ? `${e.count} found` : e.step === 'details' ? `${e.done} of ${e.total}` : '');
        }
      };
      try {
        await runImport(tripId, item.url, item.text, onEvent);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Could not reach Tripbox. Check your connection.');
        stop = true;
      }
      if (stop) {
        const left = items.length - i - 1;
        if (left) errors.push(`${left} more post${left === 1 ? ' was' : 's were'} not imported. Try them again later.`);
        break;
      }
    }
    setBatch(null);
    setFailed(errors);
    if (!done.length) {
      setError(errors[0] ?? 'Nothing was imported.');
      setPhase(items.length > 1 ? 'posts' : 'input');
      return;
    }
    setReviews(done);
    setPicked(defaultPicks(done));
    setPhase('review');
  }

  function start() {
    if (!url.trim() && !text.trim()) {
      setError('Paste a link, or type the place names.');
      return;
    }
    void importAll([{ url: url.trim(), text: text.trim() }]);
  }

  async function openFolders() {
    setError(null);
    setPhase('folders');
    try {
      setFolders(await linkboxFolders());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your Linkbox folders.');
    }
  }

  async function openFolder(f: LinkboxFolder | null) {
    setFolder(f);
    setPosts(null);
    setError(null);
    setPhase('posts');
    try {
      const list = await linkboxPosts(f);
      setPosts(list);
      // The newest posts not yet in this trip, up to the batch limit.
      setChosen(new Set(list.filter((p) => !imported.has(p.normalizedUrl)).slice(0, MAX_BATCH).map((p) => p.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this folder.');
    }
  }

  function importChosen() {
    const items = (posts ?? []).filter((p) => chosen.has(p.id)).map((p) => ({ url: p.url, text: '', title: p.title ?? undefined }));
    void importAll(items);
  }

  async function add() {
    setAdding(true);
    setError(null);
    try {
      let count = 0;
      for (const [ri, r] of reviews.entries()) {
        const picks = r.candidates.map((_, ci) => ci).filter((ci) => picked.has(pickKey(ri, ci)));
        if (picks.length) count += (await addPicked(r.linkId, picks)).length;
      }
      reset();
      onAdded(count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the places.');
    } finally {
      setAdding(false);
    }
  }

  function rate(r: 'good' | 'bad') {
    if (reviews.length !== 1) return;
    setRated(r);
    void rateImport(reviews[0].linkId, r).catch(() => {});
  }

  const placeCount = reviews.reduce((n, r) => n + r.candidates.length, 0);
  const title =
    phase === 'review'
      ? `Found ${placeCount} place${placeCount === 1 ? '' : 's'}${reviews.length > 1 ? ` in ${reviews.length} posts` : ''}`
      : phase === 'folders'
        ? 'From Linkbox'
        : phase === 'posts'
          ? (folder?.name ?? 'Not in a folder')
          : batch
            ? `Importing ${batch.total} posts`
            : 'Import a link';

  return (
    <Sheet visible={visible} onClose={close} title={title}>
      {phase === 'input' ? (
        <View style={{ gap: space.md }}>
          <Field
            label="Link to a post or page"
            value={url}
            onChangeText={setUrl}
            placeholder="Xiaohongshu, Instagram, YouTube, TikTok or a blog"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={start}
          />
          <Field
            label="Place names or post text (optional)"
            value={text}
            onChangeText={setText}
            placeholder="For videos, or posts that won't open: e.g. 鼎泰豐 信義店, 永康街 思慕昔"
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          {error ? <T tone="danger">{error}</T> : null}
          <Button label="Find places" onPress={start} />
          <Rule />
          <T variant="small" tone="muted">
            Saved the posts in Linkbox already? Import a whole folder at once.
          </T>
          <Button variant="secondary" label="From a Linkbox folder" onPress={() => void openFolders()} />
        </View>
      ) : phase === 'folders' ? (
        <View style={{ gap: space.sm }}>
          {!folders && !error ? <ActivityIndicator /> : null}
          {folders?.map((f) => (
            <ListRow
              key={f.id}
              onPress={() => void openFolder(f)}
              title={f.name}
              meta={f.shared ? `Shared${f.ownerName ? ` by ${f.ownerName}` : ''}` : ''}
            />
          ))}
          {folders ? <ListRow onPress={() => void openFolder(null)} title="Not in a folder" meta="Links you saved without a folder" /> : null}
          {error ? <T tone="danger">{error}</T> : null}
          <Button variant="secondary" label="Back" onPress={() => setPhase('input')} />
        </View>
      ) : phase === 'posts' ? (
        <View style={{ gap: space.sm }}>
          {!posts && !error ? <ActivityIndicator /> : null}
          {posts?.length ? (
            <T variant="small" tone="muted">
              {`Pick up to ${MAX_BATCH} posts. Each is read like a single link, then you choose the places from all of them.`}
            </T>
          ) : null}
          {posts?.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              checked={chosen.has(p.id)}
              note={imported.has(p.normalizedUrl) ? 'Already imported into this trip' : ''}
              onToggle={() =>
                setChosen((prev) => {
                  const next = new Set(prev);
                  if (next.has(p.id)) next.delete(p.id);
                  else if (next.size < MAX_BATCH) next.add(p.id);
                  return next;
                })
              }
            />
          ))}
          {posts && !posts.length ? <T tone="muted">No links here.</T> : null}
          {error ? <T tone="danger">{error}</T> : null}
          <View style={styles.row}>
            <Button variant="secondary" label="Back" onPress={() => setPhase('folders')} />
            <View style={{ flex: 1 }}>
              <Button
                label={chosen.size ? `Import ${chosen.size} post${chosen.size === 1 ? '' : 's'}` : 'Pick posts to import'}
                disabled={!chosen.size}
                onPress={importChosen}
              />
            </View>
          </View>
        </View>
      ) : phase === 'working' ? (
        <View style={{ gap: space.md }}>
          {batch ? (
            <View style={{ gap: space.xs }}>
              <T variant="label">{`Post ${batch.done + 1} of ${batch.total}`}</T>
              <T variant="small" tone="muted" numberOfLines={1}>
                {batch.title}
              </T>
            </View>
          ) : null}
          <Steps at={at} detail={detail} />
        </View>
      ) : (
        <View style={{ gap: space.md }}>
          {reviews.length === 1 ? (
            <View style={styles.rate}>
              <T variant="small" tone="muted" style={{ flex: 1 }}>
                How was this import?
              </T>
              <Button size="sm" variant={rated === 'good' ? 'primary' : 'secondary'} label="👍" accessibilityLabel="Good" onPress={() => rate('good')} />
              <Button
                size="sm"
                variant={rated === 'bad' ? 'primary' : 'secondary'}
                label="👎"
                accessibilityLabel="Wrong or missing places"
                onPress={() => rate('bad')}
              />
            </View>
          ) : null}
          {failed.map((f, i) => (
            <T key={i} variant="small" tone="danger">
              {f}
            </T>
          ))}
          {reviews.map((r, ri) => (
            <View key={r.linkId} style={{ gap: space.sm }}>
              <Rule />
              <Source source={r.source} />
              {r.candidates.length ? (
                r.candidates.map((c, ci) => {
                  const key = pickKey(ri, ci);
                  // The same Google place found earlier (in an earlier post, or twice in this one) is ticked only once.
                  const inEarlierPost = !!c.place_id && reviews.slice(0, ri).some((x) => x.candidates.some((y) => y.place_id === c.place_id));
                  const aboveInPost = !!c.place_id && r.candidates.slice(0, ci).some((y) => y.place_id === c.place_id);
                  return (
                    <CandidateRow
                      key={key}
                      c={c}
                      maxKm={r.maxKm}
                      extraNote={inEarlierPost ? 'Also in an earlier post' : aboveInPost ? 'Same place as above' : ''}
                      checked={picked.has(key)}
                      onToggle={() =>
                        setPicked((prev) => {
                          if (!c.place_id) return prev;
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        })
                      }
                    />
                  );
                })
              ) : (
                <T tone="muted">No places found in this post. If they’re only in the video or pictures, import it on its own and type the place names.</T>
              )}
            </View>
          ))}
          {placeCount ? <GoogleMapsCredit /> : null}
          {error ? <T tone="danger">{error}</T> : null}
          <View style={styles.row}>
            <Button variant="secondary" label="Back" onPress={() => setPhase(reviews.length > 1 ? 'posts' : 'input')} />
            <View style={{ flex: 1 }}>
              <Button
                label={picked.size ? `Add ${picked.size} place${picked.size === 1 ? '' : 's'} to this trip` : 'Pick places to add'}
                disabled={!picked.size}
                loading={adding}
                onPress={add}
              />
            </View>
          </View>
        </View>
      )}
    </Sheet>
  );
}

function ListRow({ title, meta, onPress }: { title: string; meta?: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.listRow, { borderColor: c.border }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyStrong" numberOfLines={1}>
          {title}
        </T>
        {meta ? (
          <T variant="small" tone="muted" numberOfLines={1}>
            {meta}
          </T>
        ) : null}
      </View>
      <T variant="heading">›</T>
    </Pressable>
  );
}

function PostRow({ post, checked, note, onToggle }: { post: LinkboxPost; checked: boolean; note: string; onToggle: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.candidate}>
      {post.thumbnail ? (
        <Image source={{ uri: post.thumbnail }} style={styles.postThumb} contentFit="cover" />
      ) : (
        <View style={[styles.postThumb, { backgroundColor: c.surface }]} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyStrong" numberOfLines={2}>
          {post.title || post.url}
        </T>
        <T variant="small" tone="muted" numberOfLines={1}>
          {[post.platform, post.addedBy ? `added by ${post.addedBy}` : ''].filter(Boolean).join(' · ')}
        </T>
        {note ? (
          <T variant="small" tone="muted">
            {note}
          </T>
        ) : null}
      </View>
      <Check checked={checked} />
    </Pressable>
  );
}

function Steps({ at, detail }: { at: StepKey; detail: string }) {
  const c = useColors();
  const current = STEPS.findIndex(([k]) => k === at);
  return (
    <View style={{ gap: space.sm }}>
      {STEPS.map(([key, label], i) => (
        <View key={key} style={styles.step}>
          <View style={[styles.stepMark, { borderColor: i <= current ? c.text : c.border, backgroundColor: i < current ? c.text : 'transparent' }]}>
            {i < current ? (
              <T variant="small" tone="inverse">✓</T>
            ) : i === current ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : null}
          </View>
          <T tone={i > current ? 'muted' : 'text'} style={{ flex: 1 }}>
            {label}
          </T>
          {i === current && detail ? <T variant="small" tone="muted">{detail}</T> : null}
        </View>
      ))}
      <T variant="small" tone="muted">
        Most posts take 5–15 seconds; posts with many pictures take longer.
      </T>
    </View>
  );
}

function Source({ source }: { source: ImportSource }) {
  const c = useColors();
  return (
    <View style={styles.source}>
      {source.image ? (
        <Image source={{ uri: source.image }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, { backgroundColor: c.surface }]} />
      )}
      <View style={{ flex: 1, gap: space.xs }}>
        <T variant="heading" numberOfLines={2}>
          {source.title || source.url || 'Pasted text'}
        </T>
        <T variant="small" tone="muted">
          {source.platform}
          {source.author ? ` · ${source.author}` : ''}
          {source.read_images ? ' · read the pictures too' : ''}
        </T>
      </View>
    </View>
  );
}

function CandidateRow({
  c,
  maxKm,
  extraNote,
  checked,
  onToggle,
}: {
  c: Candidate;
  maxKm: number;
  extraNote?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const found = !!c.place_id;
  const note = !found
    ? 'Not found on the map'
    : c.already
      ? 'Already in this trip'
      : (c.km_away ?? 0) > maxKm
        ? `${c.km_away?.toLocaleString()} km from your start: probably another place with the same name`
        : c.confidence === 'low'
          ? 'Unsure: check this is the right place'
          : (extraNote ?? '');
  const warn = found && !c.already && !!note;
  return (
    <Pressable
      onPress={onToggle}
      disabled={!found}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !found }}
      accessibilityLabel={c.name || c.name_local}
      style={styles.candidate}>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyStrong" numberOfLines={1}>
          {c.name || c.name_local}
          {c.name_local && c.name_local !== c.name ? <T variant="small" tone="muted">{`  ${c.name_local}`}</T> : null}
        </T>
        <T variant="small" tone="muted" numberOfLines={2}>
          {c.type}
          {c.address ? ` · ${c.address}` : ''}
        </T>
        {note ? (
          <T variant="small" tone={warn ? 'danger' : 'muted'}>
            {note}
          </T>
        ) : null}
        {c.maps_url ? (
          <T variant="small" tone="accent" onPress={() => void Linking.openURL(c.maps_url!)} accessibilityRole="link">
            Check on Google Maps ↗
          </T>
        ) : null}
      </View>
      <Check checked={checked} />
    </Pressable>
  );
}

/**
 * Google asks for the photographer's name with each Google photo, linked to their profile when there is one.
 * Unused while places show their post's cover; kept for Google photos of places searched in the app (later).
 */
export function PhotoCredit({ name, uri }: { name: string; uri?: string }) {
  return (
    <T
      variant="small"
      tone="muted"
      numberOfLines={1}
      style={{ fontSize: 10, lineHeight: 12, maxWidth: 56 }}
      onPress={uri ? () => void Linking.openURL(uri) : undefined}
      accessibilityRole={uri ? 'link' : 'text'}>
      {name}
    </T>
  );
}

/** "Google Maps" next to content from Google (addresses, place locations), as Google's attribution rules ask. */
export function GoogleMapsCredit() {
  return (
    <T variant="small" tone="muted" style={{ fontSize: 12 }}>
      Place data: Google Maps
    </T>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  rate: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 32 },
  stepMark: { width: 24, height: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  source: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  cover: { width: 64, height: 64 },
  candidate: { flexDirection: 'row', gap: space.md, alignItems: 'center', paddingVertical: space.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, padding: space.md },
  postThumb: { width: 48, height: 48 },
});
