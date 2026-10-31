import { describe, expect, it } from 'vitest';
import { DockerError } from '../scan-sources/errors.mjs';
import { acquireRuntime } from '../scan-sources/runtime.mjs';

function fakeRuntime({ daemonStates, startExit = 0, isMissing = false, stopExit = 0 }) {
  const calls = [];
  const states = [...daemonStates];
  return {
    calls,
    logs: [],
    isDaemonUp: async () => states.length > 1 ? states.shift() : states[0],
    exec: async (file, args) => {
      calls.push(`${file} ${args[0]}`);
      if (args[0] === 'start') return { exitCode: startExit, isMissing };
      return { exitCode: stopExit, isMissing: false };
    },
  };
}

const acquire = (fake, extra = {}) => acquireRuntime({ isDaemonUp: fake.isDaemonUp, exec: fake.exec, log: (m) => fake.logs.push(m), ...extra });

describe('scan runtime lifecycle', () => {
  it('starts nothing and stops nothing when the daemon is already up', async () => {
    const fake = fakeRuntime({ daemonStates: [true] });
    const runtime = await acquire(fake);
    await runtime.release();
    expect(fake.calls).toEqual([]);
    expect(runtime.startedByUs).toBe(false);
  });

  it('starts Colima when the daemon is down and stops it on release', async () => {
    const fake = fakeRuntime({ daemonStates: [false, true] });
    const runtime = await acquire(fake);
    expect(fake.calls).toEqual(['colima start']);
    await runtime.release();
    expect(fake.calls).toEqual(['colima start', 'colima stop']);
    expect(runtime.startedByUs).toBe(true);
  });

  it('leaves a Colima it started in place when keepRuntime is set', async () => {
    const fake = fakeRuntime({ daemonStates: [false, true] });
    const runtime = await acquire(fake, { keepRuntime: true });
    await runtime.release();
    expect(fake.calls).toEqual(['colima start']);
  });

  it('throws and stops nothing when Colima fails to start', async () => {
    const fake = fakeRuntime({ daemonStates: [false], startExit: 1 });
    await expect(acquire(fake)).rejects.toBeInstanceOf(DockerError);
    expect(fake.calls).toEqual(['colima start']);
  });

  it('names the missing tool when Colima is not installed', async () => {
    const fake = fakeRuntime({ daemonStates: [false], startExit: 1, isMissing: true });
    await expect(acquire(fake)).rejects.toThrow(/not installed/);
  });

  it('cleans up a Colima it started if the daemon never comes up', async () => {
    const fake = fakeRuntime({ daemonStates: [false] });
    await expect(acquire(fake)).rejects.toThrow(/still unreachable/);
    expect(fake.calls).toEqual(['colima start', 'colima stop']);
  });

  it('warns without throwing when the stop fails', async () => {
    const fake = fakeRuntime({ daemonStates: [false, true], stopExit: 1 });
    const runtime = await acquire(fake);
    await runtime.release();
    expect(fake.logs.join(' ')).toMatch(/could not stop Colima/);
  });
});
