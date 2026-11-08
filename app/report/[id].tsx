// Report form. Phase 1: saved on this phone only.
// Phase 2 sends reports to the backend so restaurants and the team can review them.

import { useRestaurants } from '@/data/useRestaurants';
import { supabase } from '@/lib/supabase';
import { colors, ui } from '@/constants/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const REASONS = [
  'I had a reaction',
  'Staff didn’t know about my allergy',
  'Information here is wrong or out of date',
  'Something else',
];

const STORAGE_KEY = 'allergy-app/reports/v1';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { restaurants } = useRestaurants();
  const restaurant = restaurants.find((r) => r.id === id);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [sentOnline, setSentOnline] = useState(false);

  const submit = async () => {
    if (!reason) return;
    const report = {
      restaurantId: id,
      reason,
      details: details.trim(),
      createdAt: new Date().toISOString(),
    };
    // Signed-in users' reports go to the backend. Accounts aren't in the app yet,
    // so until then reports are kept on the phone.
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (supabase && session) {
      const { error } = await supabase.from('reports').insert({
        restaurant_id: report.restaurantId,
        reason: report.reason,
        details: report.details,
      });
      if (!error) {
        setSentOnline(true);
        setSent(true);
        return;
      }
    }
    try {
      const existing = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '[]');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, report]));
    } catch {
      // Saving locally is best-effort.
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={[ui.screen, ui.content]}>
        <Text style={ui.title}>Thank you</Text>
        <Text style={[ui.body, { marginTop: 8 }]}>
          {sentOnline
            ? 'Your report was sent to our team and the restaurant.'
            : 'Your report is saved on this phone. Once accounts are set up, reports will go to our team and the restaurant.'}
        </Text>
        <Text style={[ui.body, { marginTop: 12, color: colors.danger }]}>
          If you are having a reaction, call 911 or use your epinephrine auto-injector.
        </Text>
        <Pressable style={[ui.button, { marginTop: 24 }]} onPress={() => router.back()}>
          <Text style={ui.buttonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={ui.subtitle}>{restaurant?.name ?? 'Restaurant'}</Text>

      <Text style={[ui.sectionTitle, { marginTop: 0 }]}>What happened?</Text>
      {REASONS.map((r) => {
        const on = reason === r;
        return (
          <Pressable
            key={r}
            onPress={() => setReason(r)}
            style={[ui.card, { marginBottom: 8, padding: 14 }, on && ui.chipOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <Text style={[ui.body, on && ui.chipTextOn]}>
              {on ? '● ' : '○ '}
              {r}
            </Text>
          </Pressable>
        );
      })}

      <Text style={ui.sectionTitle}>Details (optional)</Text>
      <TextInput
        style={[ui.input, { minHeight: 100, textAlignVertical: 'top' }]}
        placeholder="What did you order? What went wrong?"
        placeholderTextColor={colors.muted}
        value={details}
        onChangeText={setDetails}
        multiline
      />

      <Pressable
        style={[ui.button, { marginTop: 20 }, !reason && { opacity: 0.5 }]}
        onPress={submit}
        disabled={!reason}
      >
        <Text style={ui.buttonText}>Send report</Text>
      </Pressable>
    </ScrollView>
  );
}
