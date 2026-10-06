/**
 * Synthetic multi-channel trace model for the homepage signal bench.
 *
 * Every value here is generated, deterministic, and unitless. Nothing is
 * recorded neural data; the model exists to illustrate signal-level
 * interference classes from the TARA catalog.
 */

export type SignalEventKind = 'inject' | 'intercept' | 'jam' | 'replay' | 'spoof';

export interface SignalEventWindow {
  index: number;
  /** Position in the repeating schedule, i.e. which entry of the kinds list this is. */
  slot: number;
  kind: SignalEventKind;
  channel: number;
  startTime: number;
  endTime: number;
}

export interface SignalSample {
  value: number;
  isAdversarial: boolean;
}

interface EventTransformInput {
  baseline: number;
  channel: number;
  time: number;
  envelope: number;
}

type EventTransform = (input: EventTransformInput) => number;

export const EVENT_PERIOD_SECONDS = 7;
export const EVENT_LEAD_SECONDS = 1.2;
export const EVENT_DURATION_SECONDS = 2.4;
export const EVENT_EDGE_SECONDS = 0.25;
/** A replayed segment is a copy of the signal this many seconds earlier. */
export const REPLAY_SOURCE_OFFSET_SECONDS = EVENT_DURATION_SECONDS + 0.6;

const TAU = Math.PI * 2;
const NOISE_GAIN = 0.2;
const NOISE_RATE_HZ = 11;
const CHANNEL_DETUNE = 0.07;
const CHANNEL_PHASE_STEP = 1.9;
const JAM_CHANNEL_SPREAD = 1;

const BASELINE_COMPONENTS = [
  { frequencyHz: 1.3, gain: 0.34 },
  { frequencyHz: 3.1, gain: 0.22 },
  { frequencyHz: 7.9, gain: 0.12 },
] as const;

const INJECT_FREQUENCY_HZ = 19;
const INJECT_GAIN = 0.55;
const JAM_NOISE_RATE_HZ = 70;
const JAM_NOISE_GAIN = 0.8;
const JAM_BASELINE_SUPPRESSION = 0.6;
const SPOOF_FREQUENCY_HZ = 2;
const SPOOF_GAIN = 0.5;

function hashToUnit(seed: number): number {
  const scrambled = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return scrambled - Math.floor(scrambled);
}

function sampleSmoothNoise(position: number, seed: number): number {
  const cell = Math.floor(position);
  const fraction = position - cell;
  const eased = fraction * fraction * (3 - 2 * fraction);
  const left = hashToUnit(cell + seed * 57);
  const right = hashToUnit(cell + 1 + seed * 57);
  return (left + (right - left) * eased) * 2 - 1;
}

function interpolate(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/** Undisturbed trace for one channel at a point in signal time. */
export function sampleBaseline(channel: number, time: number): number {
  const detune = 1 + channel * CHANNEL_DETUNE;
  const rhythm = BASELINE_COMPONENTS.reduce(
    (sum, component, componentIndex) =>
      sum + component.gain * Math.sin(TAU * component.frequencyHz * detune * time + channel * CHANNEL_PHASE_STEP + componentIndex),
    0,
  );
  return rhythm + NOISE_GAIN * sampleSmoothNoise(time * NOISE_RATE_HZ, channel + 1);
}

const EVENT_TRANSFORMS: Record<SignalEventKind, EventTransform> = {
  inject: ({ baseline, time, envelope }) => baseline + envelope * INJECT_GAIN * Math.sin(TAU * INJECT_FREQUENCY_HZ * time),
  // Interception is passive: the signal on the wire is unchanged.
  intercept: ({ baseline }) => baseline,
  jam: ({ baseline, channel, time, envelope }) =>
    baseline * (1 - envelope * JAM_BASELINE_SUPPRESSION) +
    envelope * JAM_NOISE_GAIN * sampleSmoothNoise(time * JAM_NOISE_RATE_HZ, channel + 31),
  replay: ({ baseline, channel, time, envelope }) =>
    interpolate(baseline, sampleBaseline(channel, time - REPLAY_SOURCE_OFFSET_SECONDS), envelope),
  spoof: ({ baseline, time, envelope }) => interpolate(baseline, SPOOF_GAIN * Math.sin(TAU * SPOOF_FREQUENCY_HZ * time), envelope),
};

export function getEventIndexAt(time: number): number {
  return Math.floor(time / EVENT_PERIOD_SECONDS);
}

/** Index of the newest event that has already begun at `time`. */
export function getStartedEventIndexAt(time: number): number {
  return getEventIndexAt(time - EVENT_LEAD_SECONDS);
}

export function getScheduleSlot(index: number, slotCount: number): number {
  return ((index % slotCount) + slotCount) % slotCount;
}

/** The schedule is a pure function of the index, so any frame can be drawn without history. */
export function getEventWindow(index: number, kinds: readonly SignalEventKind[], channelCount: number): SignalEventWindow {
  if (kinds.length === 0 || channelCount < 1) {
    throw new RangeError(`getEventWindow needs at least one kind and one channel (got ${kinds.length} kinds, ${channelCount} channels)`);
  }
  const slot = getScheduleSlot(index, kinds.length);
  const channel = Math.min(channelCount - 1, Math.floor(hashToUnit(index * 3.7 + 11) * channelCount));
  const startTime = index * EVENT_PERIOD_SECONDS + EVENT_LEAD_SECONDS;
  return { index, slot, kind: kinds[slot], channel, startTime, endTime: startTime + EVENT_DURATION_SECONDS };
}

export function isChannelAffected(event: SignalEventWindow, channel: number): boolean {
  const spread = event.kind === 'jam' ? JAM_CHANNEL_SPREAD : 0;
  return Math.abs(channel - event.channel) <= spread;
}

/** 0 outside the event window, ramping to 1 inside it so traces stay continuous. */
export function getEventEnvelope(time: number, event: SignalEventWindow): number {
  if (time < event.startTime || time > event.endTime) return 0;
  const distanceToEdge = Math.min(time - event.startTime, event.endTime - time);
  return Math.min(1, distanceToEdge / EVENT_EDGE_SECONDS);
}

export function sampleChannel(channel: number, time: number, event: SignalEventWindow): SignalSample {
  const baseline = sampleBaseline(channel, time);
  const envelope = isChannelAffected(event, channel) ? getEventEnvelope(time, event) : 0;
  if (envelope === 0) return { value: baseline, isAdversarial: false };
  const value = EVENT_TRANSFORMS[event.kind]({ baseline, channel, time, envelope });
  return { value, isAdversarial: event.kind !== 'intercept' };
}
