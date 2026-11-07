import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/Screen';
import { HugbugMark } from '../components/HugbugMark';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ensureProfile } from '../lib/profile';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [resending, setResending] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const [showResend, setShowResend] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    (async () => {
      try {
        const AppleAuthentication = await import('expo-apple-authentication');
        setAppleAvailable(await AppleAuthentication.isAvailableAsync());
      } catch {
        setAppleAvailable(false);
      }
    })();
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldownSecs(60);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldownSecs((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    const target = email.trim();
    if (!target || resending || cooldownSecs > 0) return;
    setResending(true);
    setError('');
    try {
      const { error: resendError } = await supabase!.auth.resend({
        type: 'signup',
        email: target,
        options: { emailRedirectTo: 'hugbug://confirmed' },
      });
      if (resendError) {
        setError(resendError.message);
        return;
      }
      setInfo(`Confirmation email resent to ${target} — tap the link in the email and you'll come right back into the app. Check your inbox and spam folder.`);
      startCooldown();
    } catch {
      setError('Could not resend the email. Check your connection and try again.');
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async () => {
    const target = email.trim();
    setError('');
    setInfo('');
    setShowResend(false);
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Enter your email above first so we know where to send the reset link.');
      return;
    }
    setForgotSending(true);
    try {
      const { error: resetError } = await supabase!.auth.resetPasswordForEmail(target, {
        redirectTo: 'hugbug://reset-password',
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo(`Password reset email sent to ${target} — check your inbox and spam folder.`);
    } catch {
      setError('Could not send the reset email. Check your connection and try again.');
    } finally {
      setForgotSending(false);
    }
  };

  const handleSignIn = async () => {
    setError('');
    setInfo('');
    setShowResend(false);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setInfo(
            `Your email isn\u2019t confirmed yet. We sent the link to ${email.trim()} — tap it in your email and you'll come right back into the app. Check your inbox and spam folder, or resend it below.`,
          );
          setShowResend(true);
        } else {
          setError(signInError.message);
        }
      } else {
        try {
          if (data.user) await ensureProfile(data.user.id, email.trim());
        } catch {
          // Non-fatal.
        }
        router.replace('/(tabs)');
      }
    } catch {
      setError('Could not sign you in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Sign in with Apple (iOS only) — nonce-bound id_token into Supabase. */
  const handleAppleSignIn = async () => {
    setError('');
    setAppleLoading(true);
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) {
        setError('Apple did not return a sign-in token. Try again.');
        return;
      }
      const { data, error: appleError } = await supabase!.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (appleError) {
        setError(appleError.message);
        return;
      }
      try {
        if (data.user) await ensureProfile(data.user.id, data.user.email ?? '');
      } catch {
        // Non-fatal.
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        setError('Apple sign-in did not complete. Try again, or sign in with email.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <HugbugMark size={72} />
        <Text style={styles.headline}>WELCOME BACK.</Text>
        <Text style={styles.subline}>Your calm corner missed you.</Text>
      </View>

      {appleAvailable && (
        <TouchableOpacity
          style={[styles.appleBtn, (!configured || appleLoading) && styles.primaryDisabled]}
          onPress={handleAppleSignIn}
          disabled={!configured || appleLoading}
          activeOpacity={0.8}
        >
          {appleLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.appleText}>  Continue with Apple</Text>}
        </TouchableOpacity>
      )}

      <Text style={styles.label}>EMAIL</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#555555"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={configured}
      />
      <Text style={styles.label}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        placeholderTextColor="#555555"
        secureTextEntry
        editable={configured}
      />

      <TouchableOpacity onPress={handleForgotPassword} disabled={!configured || forgotSending} style={styles.forgot} activeOpacity={0.8}>
        {forgotSending ? <ActivityIndicator color="#aaaaaa" size="small" /> : <Text style={styles.forgotText}>Forgot password?</Text>}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      {showResend && (
        <TouchableOpacity
          style={[styles.resend, (resending || cooldownSecs > 0) && styles.primaryDisabled]}
          onPress={handleResend}
          disabled={resending || cooldownSecs > 0}
          activeOpacity={0.8}
        >
          {resending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.resendText}>{cooldownSecs > 0 ? `RESEND AVAILABLE IN ${cooldownSecs}s` : 'RESEND CONFIRMATION EMAIL'}</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.primary, (!configured || loading) && styles.primaryDisabled]}
        onPress={handleSignIn}
        disabled={!configured || loading}
        activeOpacity={0.8}
      >
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryText}>SIGN IN</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/sign-up')} style={styles.switch}>
        <Text style={styles.switchText}>New here? Create an account</Text>
      </TouchableOpacity>

      {!configured && (
        <Text style={styles.demoNote}>
          Sign-in is waiting on the Hugbug Supabase project — see BUILD-NOTES.md. The app still opens in demo mode
          once an account exists.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 32, marginBottom: 28 },
  headline: { color: '#ffffff', fontSize: 30, fontWeight: '800', letterSpacing: 1, marginTop: 18 },
  subline: { color: '#888888', fontSize: 15, fontStyle: 'italic', marginTop: 8 },
  label: { color: '#888888', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  error: { color: '#ff8888', fontSize: 14, marginTop: 8, marginBottom: 4 },
  info: { color: '#aaddff', fontSize: 14, marginTop: 8, lineHeight: 20 },
  primary: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 16 },
  primaryDisabled: { opacity: 0.4 },
  primaryText: { color: '#000000', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  appleBtn: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  appleText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  resend: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  resendText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  switch: { alignItems: 'center', marginTop: 18 },
  switchText: { color: '#aaaaaa', fontSize: 14, fontWeight: '600' },
  forgot: { alignItems: 'flex-end', marginTop: 2, marginBottom: 4, paddingVertical: 4 },
  forgotText: { color: '#aaaaaa', fontSize: 14, fontWeight: '600' },
  demoNote: { color: '#666666', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 24 },
});
