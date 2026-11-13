import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button, Check, Field, Rule, Sheet, T } from '@/components/ui';
import { addPicked, rateImport, runImport, type Candidate, type ImportEvent, type ImportSource } from '@/lib/importer';
import { space, useColors } from '@/lib/theme';

const STEPS = [
  ['open', 'Opening the post'],
  ['read', 'Reading its text and pictures'],
  ['find', 'Finding places'],
  ['details', 'Checking each place on the map'],
  ['done', 'Your places are ready'],
] as const;
type StepKey = (typeof STEPS)[number][0];

type Review = { linkId: string; source: ImportSource; candidates: Candidate[]; maxKm: number };

/** Paste a link -> watch the steps -> tick the places to keep -> add them to the trip. */
export function ImportSheet({
  tripId,
  visible,
  onClose,
  onAdded,
}: {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  onAdded: (count: number) => void;
}) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'input' | 'working' | 'review'>('input');
  const [at, setAt] = useState<StepKey>('open');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [rated, setRated] = useState<'good' | 'bad' | null>(null);
  const [adding, setAdding] = useState(false);

  function reset() {
    setUrl('');
    setText('');
    setPhase('input');
    setError(null);
    setReview(null);
    setPicked(new Set());
    setRated(null);
  }

  function close() {
    if (phase === 'working') return; // let the import finish; it is already paid for
    reset();
    onClose();
  }

  function onEvent(e: ImportEvent) {
    if (e.step === 'error') {
      setError(e.message);
      setPhase('input');
    } else if (e.step === 'done') {
      setReview({ linkId: e.link_id, source: e.source, candidates: e.candidates, maxKm: e.max_km });
      // Ticked by default: found on the map, new to this trip, and near the start point.
      setPicked(
        new Set(
          e.candidates
            .map((c, i) => (c.place_id && !c.already && (c.km_away ?? 0) <= e.max_km ? i : -1))
            .filter((i) => i >= 0),
        ),
      );
      setPhase('review');
    } else {
      setAt(e.step === 'find' && e.count ? 'details' : e.step);
      setDetail(e.step === 'find' ? `${e.count} found` : e.step === 'details' ? `${e.done} of ${e.total}` : '');
    }
  }

  async function start() {
    if (!url.trim() && !text.trim()) {
      setError('Paste a link, or type the place names.');
      return;
    }
    setError(null);
    setAt('open');
    setDetail('');
    setPhase('working');
    try {
      await runImport(tripId, url.trim(), text.trim(), onEvent);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach Tripbox. Check your connection.');
      setPhase('input');
    }
  }

  async function add() {
    if (!review) return;
    setAdding(true);
    try {
      const added = await addPicked(review.linkId, [...picked]);
      reset();
      onAdded(added.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the places.');
    } finally {
      setAdding(false);
    }
  }

  function rate(r: 'good' | 'bad') {
    if (!review) return;
    setRated(r);
    void rateImport(review.linkId, r).catch(() => {});
  }

  const title =
    phase === 'review' && review
      ? `Found ${review.candidates.length} place${review.candidates.length === 1 ? '' : 's'}`
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
        </View>
      ) : phase === 'working' ? (
        <Steps at={at} detail={detail} />
      ) : review ? (
        <View style={{ gap: space.md }}>
          <Source source={review.source} />
          <View style={styles.rate}>
            <T variant="small" tone="muted" style={{ flex: 1 }}>
              How was this import?
            </T>
            <Button size="sm" variant={rated === 'good' ? 'primary' : 'secondary'} label="👍" accessibilityLabel="Good" onPress={() => rate('good')} />
            <Button size="sm" variant={rated === 'bad' ? 'primary' : 'secondary'} label="👎" accessibilityLabel="Wrong or missing places" onPress={() => rate('bad')} />
          </View>
          <Rule />
          {review.candidates.length ? (
            review.candidates.map((c, i) => (
              <CandidateRow
                key={`${i}-${c.name}`}
                c={c}
                maxKm={review.maxKm}
                checked={picked.has(i)}
                onToggle={() =>
                  setPicked((prev) => {
                    if (!c.place_id) return prev;
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
              />
            ))
          ) : (
            <T tone="muted">No places found in this post. If they’re only in the video or pictures, go back and type the place names.</T>
          )}
          {review.candidates.length ? <GoogleMapsCredit /> : null}
          {error ? <T tone="danger">{error}</T> : null}
          <View style={styles.row}>
            <Button variant="secondary" label="Back" onPress={() => setPhase('input')} />
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
      ) : null}
    </Sheet>
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

function CandidateRow({ c, maxKm, checked, onToggle }: { c: Candidate; maxKm: number; checked: boolean; onToggle: () => void }) {
  const colors = useColors();
  const found = !!c.place_id;
  const note = !found
    ? 'Not found on the map'
    : c.already
      ? 'Already in this trip'
      : (c.km_away ?? 0) > maxKm
        ? `${c.km_away?.toLocaleString()} km from your start: probably another place with the same name`
        : c.confidence === 'low'
          ? 'Unsure: check this is the right place'
          : '';
  const warn = found && !c.already && !!note;
  return (
    <Pressable
      onPress={onToggle}
      disabled={!found}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !found }}
      accessibilityLabel={c.name || c.name_local}
      style={styles.candidate}>
      <View style={{ gap: 2 }}>
        {c.photo_uri ? <Image source={{ uri: c.photo_uri }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.surface }]} />}
        {c.photo_credit ? <PhotoCredit name={c.photo_credit} uri={c.photo_credit_uri} /> : null}
      </View>
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
      </View>
      <Check checked={checked} />
    </Pressable>
  );
}

/** Google asks for the photographer's name with each Google photo, linked to their profile when there is one. */
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

/** "Google Maps" next to content from Google (address, photos), as Google's attribution rules ask. */
export function GoogleMapsCredit() {
  return (
    <T variant="small" tone="muted" style={{ fontSize: 12 }}>
      Places and photos: Google Maps
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
  thumb: { width: 56, height: 56 },
});
