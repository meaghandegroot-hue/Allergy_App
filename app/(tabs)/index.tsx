import { restaurants } from '@/data/restaurants';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function HomeScreen() {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const allergyOptions = ['gluten', 'dairy', 'peanut', 'shellfish'];

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 20 }}>
        Restaurants
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        {allergyOptions.map((allergy) => (
          <Text
            key={allergy}
            onPress={() => {
              setSelectedAllergies((prev) =>
                prev.includes(allergy)
                  ? prev.filter((a) => a !== allergy)
                  : [...prev, allergy]
              );
            }}
            style={{
              marginRight: 10,
              marginBottom: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: selectedAllergies.includes(allergy) ? 'black' : '#ccc',
              borderRadius: 6,
            }}
          >
            {allergy}
          </Text>
        ))}
      </View>

      {restaurants
        .filter(
          (restaurant) =>
            selectedAllergies.length === 0 ||
            selectedAllergies.every((allergy) =>
              restaurant.allergens.includes(allergy)
            )
        )
        .map((restaurant) => (
          <View
            key={restaurant.id}
            style={{
              marginBottom: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600' }}>
              {restaurant.name}
            </Text>

            <Text>{restaurant.cuisine}</Text>

            <Text style={{ marginTop: 8 }}>
              Allergies: {restaurant.allergens.join(', ')}
            </Text>

            {restaurant.callAhead && (
              <Text style={{ marginTop: 8 }}>
                Call ahead recommended
              </Text>
            )}
          </View>
        ))}
    </ScrollView>
  );
}