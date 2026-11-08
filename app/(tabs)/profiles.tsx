import { allergenName } from '@/data/allergens';
import { colors, ui } from '@/constants/ui';
import { useProfiles } from '@/store/profiles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilesScreen() {
  const { profiles, addProfile } = useProfiles();
  const [name, setName] = useState('');

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const profile = addProfile(trimmed);
    setName('');
    router.push({ pathname: '/profile/[id]', params: { id: profile.id } });
  };

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.title}>Allergy profiles</Text>
        <Text style={ui.subtitle}>
          Add a profile for each person you eat with. Saved on this phone.
        </Text>

        {profiles.map((p) => {
          const all = [...p.allergenIds.map(allergenName), ...p.customAllergens];
          return (
            <Pressable
              key={p.id}
              style={ui.card}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>{p.name}</Text>
              <Text style={[ui.muted, { marginTop: 4 }]}>
                {all.length ? all.join(', ') : 'No allergies added yet — tap to add'}
              </Text>
            </Pressable>
          );
        })}

        <Text style={ui.sectionTitle}>Add a person</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[ui.input, { flex: 1 }]}
            placeholder="Name, e.g. Me or Sam"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            onSubmitEditing={create}
            returnKeyType="done"
          />
          <Pressable style={[ui.button, !name.trim() && { opacity: 0.5 }]} onPress={create}>
            <Text style={ui.buttonText}>Add</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
