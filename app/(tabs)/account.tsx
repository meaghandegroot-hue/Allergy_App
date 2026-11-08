import { colors, ui } from '@/constants/ui';
import { useAuth } from '@/store/auth';
import { useProfiles } from '@/store/profiles';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { available, session, loading } = useAuth();

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.title}>Account</Text>
        {!available ? (
          <Text style={[ui.body, { marginTop: 8 }]}>
            Accounts aren’t switched on in this version yet. Your profiles are saved on this phone.
          </Text>
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : session ? (
          <SignedIn email={session.user.email ?? ''} />
        ) : (
          <SignInForm />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SignInForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const canSubmit = email.includes('@') && password.length >= 6 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = isSignup ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (result.error) return setError(result.error);
    if (result.needsConfirmation) {
      setNotice(`We sent a confirmation link to ${email.trim()}. Tap it, then come back and log in.`);
      setMode('login');
      setPassword('');
    }
  };

  return (
    <View>
      <Text style={ui.subtitle}>
        {isSignup
          ? 'Create an account to keep your family’s allergy profiles safe if you change phones.'
          : 'Log in to see your saved allergy profiles.'}
      </Text>

      <Text style={ui.muted}>Email</Text>
      <TextInput
        style={[ui.input, { marginTop: 4, marginBottom: 14 }]}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />

      <Text style={ui.muted}>Password{isSignup ? ' (at least 6 characters)' : ''}</Text>
      <TextInput
        style={[ui.input, { marginTop: 4 }]}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={isSignup ? 'new-password' : 'current-password'}
        textContentType={isSignup ? 'newPassword' : 'password'}
        onSubmitEditing={submit}
        returnKeyType="go"
      />

      {error && <Text style={[ui.body, { color: colors.danger, marginTop: 12 }]}>{error}</Text>}
      {notice && (
        <View style={[ui.banner, { marginTop: 12, marginBottom: 0 }]}>
          <Text style={ui.bannerText}>{notice}</Text>
        </View>
      )}

      <Pressable
        style={[ui.button, { marginTop: 20 }, !canSubmit && { opacity: 0.5 }]}
        onPress={submit}
        disabled={!canSubmit}
      >
        {busy ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={ui.buttonText}>{isSignup ? 'Create account' : 'Log in'}</Text>
        )}
      </Pressable>

      <Pressable
        style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
        onPress={() => {
          setMode(isSignup ? 'login' : 'signup');
          setError(null);
        }}
      >
        <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 15 }}>
          {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
        </Text>
      </Pressable>
    </View>
  );
}

function SignedIn({ email }: { email: string }) {
  const { signOut, deleteAccount } = useAuth();
  const { profiles, syncError } = useProfiles();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View>
      <Text style={ui.subtitle}>Logged in as {email}</Text>

      <View style={ui.card}>
        <Text style={ui.body}>
          {profiles.length} allergy {profiles.length === 1 ? 'profile is' : 'profiles are'} saved to
          your account. Log in on another phone and they’ll be there.
        </Text>
        {syncError && (
          <Text style={[ui.muted, { color: colors.danger, marginTop: 8 }]}>{syncError}</Text>
        )}
      </View>

      <Pressable style={[ui.buttonOutline, { marginTop: 8 }]} onPress={signOut}>
        <Text style={ui.buttonOutlineText}>Log out</Text>
      </Pressable>
      <Text style={[ui.muted, { marginTop: 8 }]}>
        Logging out removes the profiles from this phone. They stay in your account.
      </Text>

      <Pressable
        style={[ui.buttonOutline, { marginTop: 40, borderColor: colors.danger }]}
        onPress={async () => {
          if (!confirmDelete) return setConfirmDelete(true);
          const result = await deleteAccount();
          if (result.error) setError(result.error);
        }}
      >
        <Text style={[ui.buttonOutlineText, { color: colors.danger }]}>
          {confirmDelete ? 'Tap again to permanently delete' : 'Delete my account'}
        </Text>
      </Pressable>
      {confirmDelete && !error && (
        <Text style={[ui.muted, { marginTop: 8 }]}>
          This deletes your account and all its allergy profiles. It can’t be undone.
        </Text>
      )}
      {error && <Text style={[ui.body, { color: colors.danger, marginTop: 8 }]}>{error}</Text>}
    </View>
  );
}
