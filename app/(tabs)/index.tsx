import { ScrollView, Text, View } from 'react-native';
import { restaurants } from '@/data/restaurants';

export default function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 20 }}>
        Restaurants
      </Text>

      {restaurants.map((restaurant) => (
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