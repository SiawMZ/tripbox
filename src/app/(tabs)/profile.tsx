import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, Rule, ScreenHeader, SectionLabel, T } from '@/components/ui';
import { isStrongPassword, PASSWORD_HINT } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { pad2, space, useColors } from '@/lib/theme';

export default function Profile() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { session, trips, displayName } = useStore();
  const user = session?.user;
  const owned = trips.filter((t) => t.owner_id === user?.id).length;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + space.xl }]}
      keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Profile" meta={`${pad2(2)}  Account`} />

      <SectionLabel index="01">Trips</SectionLabel>
      <View style={styles.stats}>
        <Stat value={trips.length} label="Trips" />
        <Stat value={owned} label="Created by you" />
        <Stat value={trips.reduce((n, t) => n + (t.place_count ?? 0), 0)} label="Places" />
      </View>

      <SectionLabel index="02">Account</SectionLabel>
      <View style={{ gap: space.xs }}>
        <DisplayName key={displayName ?? ''} saved={displayName} />
        <T variant="label" tone="muted">Email</T>
        <T variant="heading">{user?.email}</T>
        {user?.created_at ? (
          <T variant="small" tone="muted">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </T>
        ) : null}
      </View>
      <ChangePassword />
      <Button variant="secondary" label="Sign out" onPress={() => supabase.auth.signOut()} />

      <SectionLabel index="03">Delete your Tripbox data</SectionLabel>
      <DeleteTripboxData owned={owned} />
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, gap: space.xs }}>
      <T variant="display">{value}</T>
      <T variant="label" tone="muted">{label}</T>
    </View>
  );
}

/** The name people in trips I share see ("Added by …"). Shared with Linkbox, like the login. */
function DisplayName({ saved }: { saved: string | null }) {
  const { setDisplayName } = useStore();
  const [name, setName] = useState(saved ?? '');
  const [note, setNote] = useState<string | null>(null);

  async function save() {
    setNote(null);
    try {
      await setDisplayName(name);
      setNote('Saved.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <View style={{ gap: space.sm, paddingBottom: space.md }}>
      <View style={styles.inline}>
        <View style={{ flex: 1 }}>
          <Field label="Name in shared trips" value={name} onChangeText={setName} maxLength={40} onSubmitEditing={save} />
        </View>
        <Button label="Save" variant="secondary" disabled={!name.trim() || name.trim() === saved} onPress={save} />
      </View>
      {note ? <T variant="small" tone="muted">{note}</T> : null}
    </View>
  );
}

function ChangePassword() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setNote(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setNote(error ? error.message : 'Password updated.');
    if (!error) setPassword('');
  }

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.inline}>
        <View style={{ flex: 1 }}>
          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder={PASSWORD_HINT}
          />
        </View>
        <Button label="Change" variant="secondary" loading={busy} disabled={!isStrongPassword(password)} onPress={save} />
      </View>
      {note ? <T variant="small" tone="muted">{note}</T> : null}
    </View>
  );
}

/**
 * The login is shared with Linkbox (same Supabase project), so Tripbox never deletes the account itself:
 * it deletes the trips this person created. Deleting the login is done from Linkbox's profile.
 */
function DeleteTripboxData({ owned }: { owned: number }) {
  const { deleteMyTrips } = useStore();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function remove() {
    const ok = await confirm(
      'Delete your Tripbox data?',
      `This permanently deletes the ${owned} trip${owned === 1 ? '' : 's'} you created, with their links and places, for everyone in them. Your login stays, because Linkbox uses it too. This cannot be undone.`,
      'Delete trips',
    );
    if (!ok) return;
    setBusy(true);
    setNote(null);
    try {
      const n = await deleteMyTrips();
      setNote(`Deleted ${n} trip${n === 1 ? '' : 's'}.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not delete your trips. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.sm }}>
      <T tone="muted">
        Deletes every trip you created. Your login is shared with Linkbox, so it isn’t deleted here; to delete the login
        itself, use Delete account in Linkbox.
      </T>
      <Button variant="danger" label="Delete my trips" loading={busy} disabled={!owned} onPress={remove} />
      {note ? <T tone="muted">{note}</T> : null}
      <Rule />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.xl, width: '100%', maxWidth: 760, alignSelf: 'center' },
  stats: { flexDirection: 'row', gap: space.lg },
  inline: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
});
