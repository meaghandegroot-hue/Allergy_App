import { allergenName } from '@/data/allergens';
import { colors, ui } from '@/constants/ui';
import { useAuth } from '@/store/auth';
import { useProfiles } from '@/store/profiles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilesScreen() {
  const { profiles, addProfile, syncError } = useProfiles();
  const { available, session } = useAuth();
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
          Add a profile for each person you eat with.{' '}
          {session ? 'Saved to your account.' : 'Saved on this phone.'}
        </Text>

        {available && !session && (
          <Pressable style={ui.banner} onPress={() => router.push('/account')}>
            <Text style={ui.bannerText}>
              Create an account or log in to keep these if you change phones →
            </Text>
          </Pressable>
        )}
        {syncError && (
          <Text style={[ui.muted, { color: colors.danger, marginBottom: 12 }]}>{syncError}</Text>
        )}

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
