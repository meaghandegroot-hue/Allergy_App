import { allergenName } from '@/data/allergens';
import { restaurants } from '@/data/restaurants';
import { colors, ui } from '@/constants/ui';
import { useDiningAllergies } from '@/store/profiles';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = restaurants.find((r) => r.id === id);
  const { allergenIds, customAllergens } = useDiningAllergies();

  if (!restaurant) {
    return (
      <View style={[ui.screen, ui.content]}>
        <Text style={ui.body}>Restaurant not found.</Text>
      </View>
    );
  }

  const yours = allergenIds.filter((a) => restaurant.accommodates.includes(a));
  const others = restaurant.accommodates.filter((a) => !allergenIds.includes(a));

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Stack.Screen options={{ title: restaurant.name }} />

      <Text style={ui.title}>{restaurant.name}</Text>
      <Text style={ui.subtitle}>
        {restaurant.cuisine} · {restaurant.address}
      </Text>

      {restaurant.callAhead && (
        <View style={ui.banner}>
          <Text style={ui.bannerText}>📞 Call ahead recommended so the kitchen can prepare.</Text>
        </View>
      )}

      {yours.length > 0 && (
        <>
          <Text style={[ui.sectionTitle, { marginTop: 0 }]}>Your allergies they accommodate</Text>
          <View style={ui.row}>
            {yours.map((a) => (
              <View key={a} style={[ui.chip, ui.chipOn]}>
                <Text style={[ui.chipText, ui.chipTextOn]}>✓ {allergenName(a)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {customAllergens.length > 0 && (
        <Text style={[ui.body, { marginTop: 12, color: colors.warn }]}>
          Ask staff about: {customAllergens.join(', ')} — not listed by restaurants yet.
        </Text>
      )}

      {others.length > 0 && (
        <>
          <Text style={ui.sectionTitle}>
            {yours.length ? 'Also accommodates' : 'Accommodates'}
          </Text>
          <View style={ui.row}>
            {others.map((a) => (
              <View key={a} style={ui.chip}>
                <Text style={ui.chipText}>{allergenName(a)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={ui.sectionTitle}>Cross-contact</Text>
      <Text style={ui.body}>{restaurant.crossContact}</Text>

      <Text style={ui.sectionTitle}>Notes from the restaurant</Text>
      <Text style={ui.body}>{restaurant.notes}</Text>

      <Text style={[ui.muted, { marginTop: 16 }]}>Last updated {restaurant.updated}</Text>

      <View style={[ui.banner, { marginTop: 20 }]}>
        <Text style={ui.bannerText}>
          This is the restaurant’s own information. Always confirm your allergies with staff when
          you order.
        </Text>
      </View>

      <Pressable
        style={ui.buttonOutline}
        onPress={() => router.push({ pathname: '/report/[id]', params: { id: restaurant.id } })}
      >
        <Text style={ui.buttonOutlineText}>Report a problem</Text>
      </Pressable>
    </ScrollView>
  );
}
