import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/Screen';

/**
 * In-app rendering of the Hugbug App Privacy Policy.
 * No website version exists yet — when Joey publishes one, keep this
 * in sync with it. Last updated: November 6, 2026.
 */
type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; lead?: string; text: string };

const POLICY: Block[] = [
  {
    kind: 'paragraph',
    text: 'This Privacy Policy covers the Hugbug: Stress Relief Games mobile app (the “App”). It describes what information the App collects, how we use it, and the choices you have.',
  },
  { kind: 'heading', text: 'Information we collect' },
  {
    kind: 'bullet',
    lead: 'Account information.',
    text: 'When you create an account, we collect your email address and a password. Passwords are stored as irreversible hashes by our authentication provider — we never see or store your actual password.',
  },
  {
    kind: 'bullet',
    lead: 'Game progress.',
    text: 'Which games you play, your gentle streak, and your garden progress, tied to your account so it follows you between devices. It is also cached on your device so the App works offline.',
  },
  {
    kind: 'bullet',
    lead: 'Push notification token.',
    text: 'If you allow notifications, we store a push token linked to your account so we can send you gentle reminders. You can turn notifications off at any time in your device settings or in the App; doing so stops the messages but does not delete your account.',
  },
  {
    kind: 'bullet',
    lead: 'Device information.',
    text: 'We check basic device information (such as whether you are using a physical device and your operating system version) so the App works correctly. We do not collect advertising identifiers.',
  },
  { kind: 'heading', text: 'What we do not collect' },
  {
    kind: 'paragraph',
    text: 'We do not collect your precise location, your contacts, your photos or files, or your browsing history outside the App. The App has no ads and no third-party trackers.',
  },
  { kind: 'heading', text: 'How we use your information' },
  {
    kind: 'bullet',
    text: 'To operate your account and keep your game progress in sync.',
  },
  {
    kind: 'bullet',
    text: 'To send the gentle reminders you opted into.',
  },
  {
    kind: 'bullet',
    text: 'To keep the App secure and fix problems.',
  },
  { kind: 'heading', text: 'How we share your information' },
  {
    kind: 'paragraph',
    text: 'We do not sell your personal information. We share it only with the service providers that power the App:',
  },
  {
    kind: 'bullet',
    lead: 'Supabase',
    text: '— our database and authentication provider, which stores your account and game progress securely.',
  },
  {
    kind: 'bullet',
    lead: 'Expo',
    text: '— delivers push notifications to your device.',
  },
  {
    kind: 'paragraph',
    text: 'These providers may only use your information to provide their services to us.',
  },
  { kind: 'heading', text: 'Data retention and deletion' },
  {
    kind: 'paragraph',
    text: 'We keep your account and game progress for as long as your account is active. You can request deletion of your account and all associated data at any time by emailing contact@beatrackfam.info from the email address on your account. We will confirm and complete the deletion within 30 days, except for records we are required to keep for legal purposes.',
  },
  { kind: 'heading', text: 'Children’s privacy' },
  {
    kind: 'paragraph',
    text: 'The App is not directed at children under 13, and we do not knowingly collect personal information from children under 13.',
  },
  { kind: 'heading', text: 'Security' },
  {
    kind: 'paragraph',
    text: 'Your data is encrypted in transit and stored on secure infrastructure. No method of transmission over the internet is completely secure, but we use industry-standard safeguards to protect your information.',
  },
  { kind: 'heading', text: 'Changes to this policy' },
  {
    kind: 'paragraph',
    text: 'If we change this policy, we will post the updated version on this page and revise the date above.',
  },
  { kind: 'heading', text: 'Contact us' },
  {
    kind: 'paragraph',
    text: 'Questions or concerns? Email us at contact@beatrackfam.info.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <Screen>
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.8}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      <Text style={styles.headline}>PRIVACY POLICY.</Text>
      <Text style={styles.subline}>Hugbug: Stress Relief Games — Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: November 6, 2026</Text>

      {POLICY.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <Text key={i} style={styles.heading}>
              {block.text.toUpperCase()}
            </Text>
          );
        }
        if (block.kind === 'bullet') {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.body}>
                {block.lead ? <Text style={styles.lead}>{block.lead} </Text> : null}
                {block.text}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.body}>
            {block.text}
          </Text>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: 12, marginBottom: 4, alignSelf: 'flex-start' },
  backText: { color: '#aaaaaa', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  headline: { color: '#ffffff', fontSize: 30, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  subline: { color: '#888888', fontSize: 15, fontStyle: 'italic', marginTop: 6 },
  updated: { color: '#666666', fontSize: 13, marginTop: 4, marginBottom: 10 },
  heading: { color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 3, marginTop: 22, marginBottom: 8 },
  body: { color: '#cccccc', fontSize: 14, lineHeight: 21, marginBottom: 8, flexShrink: 1 },
  lead: { color: '#ffffff', fontWeight: '700' },
  bulletRow: { flexDirection: 'row', paddingLeft: 4, marginBottom: 2 },
  bulletDot: { color: '#888888', fontSize: 14, lineHeight: 21, marginRight: 8 },
});
