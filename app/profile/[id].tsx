import { allergenGroups, allergenName, allergens } from '@/data/allergens';
import { colors, ui } from '@/constants/ui';
import { useProfiles } from '@/store/profiles';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function ProfileEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, updateProfile, deleteProfile } = useProfiles();
  const profile = profiles.find((p) => p.id === id);

  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!profile) {
    return (
      <View style={[ui.screen, ui.content]}>
        <Text style={ui.body}>This profile no longer exists.</Text>
      </View>
    );
  }

  const selected = new Set(profile.allergenIds);
  const toggle = (allergenId: string) => {
    const next = selected.has(allergenId)
      ? profile.allergenIds.filter((x) => x !== allergenId)
      : [...profile.allergenIds, allergenId];
    updateProfile(profile.id, { allergenIds: next });
  };

  const addCustom = () => {
    const value = custom.trim();
    if (!value) return;
    // If it's actually on the list, select it instead of adding a duplicate.
    const match = allergens.find((x) => x.name.toLowerCase() === value.toLowerCase());
    if (match) {
      if (!selected.has(match.id)) toggle(match.id);
    } else if (!profile.customAllergens.some((c) => c.toLowerCase() === value.toLowerCase())) {
      updateProfile(profile.id, { customAllergens: [...profile.customAllergens, value] });
    }
    setCustom('');
  };

  const removeCustom = (value: string) =>
    updateProfile(profile.id, {
      customAllergens: profile.customAllergens.filter((c) => c !== value),
    });

  const q = query.trim().toLowerCase();
  const matches = q ? allergens.filter((x) => x.name.toLowerCase().includes(q)) : allergens;

  const chip = (allergenId: string, label: string) => {
    const on = selected.has(allergenId);
    return (
      <Pressable
        key={allergenId}
        onPress={() => toggle(allergenId)}
        style={[ui.chip, on && ui.chipOn]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
      >
        <Text style={[ui.chipText, on && ui.chipTextOn]}>
          {on ? '✓ ' : ''}
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: profile.name }} />

      <Text style={ui.muted}>Name</Text>
      <TextInput
        style={[ui.input, { marginTop: 4 }]}
        value={profile.name}
        onChangeText={(name) => updateProfile(profile.id, { name })}
      />

      <Text style={ui.sectionTitle}>
        Allergies ({profile.allergenIds.length + profile.customAllergens.length})
      </Text>
      {profile.allergenIds.length + profile.customAllergens.length === 0 ? (
        <Text style={ui.muted}>None yet — pick from the list below.</Text>
      ) : (
        <View style={ui.row}>
          {profile.allergenIds.map((x) => chip(x, allergenName(x)))}
          {profile.customAllergens.map((c) => (
            <Pressable key={c} onPress={() => removeCustom(c)} style={[ui.chip, ui.chipOn]}>
              <Text style={[ui.chipText, ui.chipTextOn]}>✓ {c} (added) ✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={ui.sectionTitle}>Find an allergen</Text>
      <TextInput
        style={ui.input}
        placeholder="Search, e.g. celery, garlic, kiwi"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {q ? (
        <View style={[ui.row, { marginTop: 12 }]}>
          {matches.length ? (
            matches.map((x) => chip(x.id, x.name))
          ) : (
            <Text style={ui.muted}>
              No match for “{query.trim()}”. Add it below as your own.
            </Text>
          )}
        </View>
      ) : (
        allergenGroups.map((group) => (
          <View key={group}>
            <Text style={[ui.muted, { marginTop: 16, marginBottom: 6, fontWeight: '600' }]}>
              {group.toUpperCase()}
            </Text>
            <View style={ui.row}>
              {allergens.filter((x) => x.group === group).map((x) => chip(x.id, x.name))}
            </View>
          </View>
        ))
      )}

      <Text style={ui.sectionTitle}>My allergen isn’t listed</Text>
      <Text style={[ui.muted, { marginBottom: 8 }]}>
        Add it here. Restaurants don’t list it yet, so we’ll remind you to ask about it.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={[ui.input, { flex: 1 }]}
          placeholder="e.g. Carrot"
          placeholderTextColor={colors.muted}
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <Pressable style={[ui.button, !custom.trim() && { opacity: 0.5 }]} onPress={addCustom}>
          <Text style={ui.buttonText}>Add</Text>
        </Pressable>
      </View>

      <Pressable
        style={[ui.buttonOutline, { marginTop: 32, borderColor: colors.danger }]}
        onPress={() => {
          if (!confirmDelete) return setConfirmDelete(true);
          deleteProfile(profile.id);
          router.back();
        }}
      >
        <Text style={[ui.buttonOutlineText, { color: colors.danger }]}>
          {confirmDelete ? `Tap again to delete ${profile.name}` : 'Delete profile'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
