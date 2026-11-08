import { allergenName, allergens } from '@/data/allergens';
import { useRestaurants } from '@/data/useRestaurants';
import { colors, ui } from '@/constants/ui';
import { useDiningAllergies, useProfiles } from '@/store/profiles';
import { Coords, distanceKm, formatKm } from '@/utils/distance';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FindScreen() {
  const { profiles, diningIds, toggleDining, loaded } = useProfiles();
  const { allergenIds, customAllergens } = useDiningAllergies();
  const { restaurants, loading, error } = useRestaurants();
  const showingSamples = restaurants.some((r) => r.isSample);

  const [query, setQuery] = useState('');
  const [here, setHere] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const toggleNearMe = async () => {
    if (here) return setHere(null);
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission was not given, so we can’t sort by distance.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setHere({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      setLocationError('Couldn’t get your location. Try again in a moment.');
    } finally {
      setLocating(false);
    }
  };

  // Typed search: matches restaurant name/cuisine, or an allergen the restaurant accommodates.
  const q = query.trim().toLowerCase();
  const queryAllergenIds = q
    ? allergens.filter((a) => a.name.toLowerCase().includes(q)).map((a) => a.id)
    : [];

  const results = restaurants
    .filter((r) => allergenIds.every((id) => r.accommodates.includes(id)))
    .filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        queryAllergenIds.some((id) => r.accommodates.includes(id))
    )
    .map((r) => ({ restaurant: r, km: here ? distanceKm(here, r) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.title}>Find a restaurant</Text>
        <Text style={ui.subtitle}>Vernon, BC restaurants that accommodate your allergies</Text>

        <View style={ui.banner}>
          <Text style={ui.bannerText}>
            {showingSamples ? 'Sample restaurants for testing — not real listings yet. ' : ''}
            Always confirm your allergies with staff when you order.
          </Text>
        </View>

        <Text style={[ui.sectionTitle, { marginTop: 0 }]}>Who’s eating?</Text>
        {loaded && profiles.length === 0 ? (
          <Pressable style={ui.card} onPress={() => router.push('/profiles')}>
            <Text style={ui.body}>
              Add an allergy profile to see only restaurants that accommodate you.
            </Text>
            <Text style={[ui.body, { color: colors.accent, fontWeight: '600', marginTop: 8 }]}>
              Create a profile →
            </Text>
          </Pressable>
        ) : (
          <View style={ui.row}>
            {profiles.map((p) => {
              const on = diningIds.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleDining(p.id)}
                  style={[ui.chip, on && ui.chipOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[ui.chipText, on && ui.chipTextOn]}>
                    {on ? '✓ ' : ''}
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {allergenIds.length > 0 && (
          <Text style={[ui.muted, { marginTop: 10 }]}>
            Must accommodate: {allergenIds.map(allergenName).join(', ')}
          </Text>
        )}
        {customAllergens.length > 0 && (
          <View style={[ui.banner, { marginTop: 10, marginBottom: 0 }]}>
            <Text style={ui.bannerText}>
              Restaurants don’t list {customAllergens.join(', ')} yet — ask about{' '}
              {customAllergens.length === 1 ? 'it' : 'them'} when you order.
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
          <TextInput
            style={[ui.input, { flex: 1 }]}
            placeholder="Search name, cuisine or allergen"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <Pressable
            onPress={toggleNearMe}
            style={[ui.chip, { justifyContent: 'center' }, here && ui.chipOn]}
            accessibilityRole="switch"
            accessibilityState={{ checked: !!here }}
          >
            {locating ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[ui.chipText, here && ui.chipTextOn]}>📍 Near me</Text>
            )}
          </Pressable>
        </View>
        {locationError && (
          <Text style={[ui.muted, { color: colors.danger, marginTop: 6 }]}>{locationError}</Text>
        )}

        <Text style={ui.sectionTitle}>
          {results.length} {results.length === 1 ? 'match' : 'matches'}
          {here ? ' · closest first' : ''}
        </Text>

        {loading && <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />}
        {error && <Text style={[ui.body, { color: colors.danger }]}>{error}</Text>}

        {!loading && !error && results.length === 0 && (
          <Text style={ui.body}>
            {allergenIds.length
              ? 'No restaurant accommodates all of these allergies yet. Try unticking someone under “Who’s eating?”'
              : 'No restaurants match your search.'}
          </Text>
        )}

        {results.map(({ restaurant: r, km }) => (
          <Pressable
            key={r.id}
            style={ui.card}
            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: r.id } })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 }}>
                {r.name}
              </Text>
              {km !== null && <Text style={ui.muted}>{formatKm(km)}</Text>}
            </View>
            <Text style={ui.muted}>
              {r.cuisine} · {r.address}
            </Text>
            {allergenIds.length > 0 && (
              <Text style={{ marginTop: 8, color: colors.accent, fontWeight: '600' }}>
                ✅ Accommodates all {allergenIds.length} of your allergies
              </Text>
            )}
            {r.callAhead && (
              <Text style={{ marginTop: 4, color: colors.warn }}>📞 Call ahead recommended</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
