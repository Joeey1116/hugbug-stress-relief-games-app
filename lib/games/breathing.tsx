import { GameShell } from '../../components/GameShell';
import { BreathingSession } from '../../components/BreathingSession';

/** Breathing — the guided-session anchor, also reachable from the Breathe tab. */
export default function BreathingGame() {
  return (
    <GameShell gameId="breathing" title="Breathing" subtitle="Guided sessions, always here. Pick a rhythm and follow the circle — it never rushes you.">
      <BreathingSession />
    </GameShell>
  );
}
