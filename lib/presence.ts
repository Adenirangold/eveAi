type PresenceStatus = "online" | "offline" | "recently_online";

export interface FakePresence {
  status: PresenceStatus;
  lastSeenMinutesAgo: number | null;
}

// Simple deterministic string hash so the same contact id always
// produces the same pseudo-random pattern.
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Pseudo-random in [0, 1) based on a seed.
function seededRandom(seed: number): number {
  // xorshift32
  let x = seed || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  // Convert to [0, 1)
  return ((x >>> 0) % 100000) / 100000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Core fake presence generator.
export function getFakePresence(contactId: string, now: Date): FakePresence {
  const minutesSinceEpoch = Math.floor(now.getTime() / 60000);
  const blockSizeMinutes = 10;
  const blockIndex = Math.floor(minutesSinceEpoch / blockSizeMinutes);

  const baseSeed = hashString(contactId);

  // Derive a "chattiness" factor from the base seed in [0, 1].
  const chattiness = seededRandom(baseSeed);

  const hour = now.getHours();
  const isDaytime = hour >= 9 && hour < 22;
  const dayWeight = isDaytime ? 1 : 0;

  // Online probability per 10-minute block.
  const pOnlineBase = 0.3 + 0.4 * chattiness + 0.2 * dayWeight;
  const pOnline = clamp(pOnlineBase, 0.2, 0.9);

  // Decide if the current block is online.
  const currentSeed = baseSeed ^ blockIndex;
  const currentRand = seededRandom(currentSeed);
  const isCurrentlyOnline = currentRand < pOnline;

  if (isCurrentlyOnline) {
    return {
      status: "online",
      lastSeenMinutesAgo: 0,
    };
  }

  // Look backwards over previous blocks (up to 6 hours) to find the last
  // online block and derive "last seen".
  const maxLookbackBlocks = Math.floor((6 * 60) / blockSizeMinutes);
  let lastOnlineBlockIndex: number | null = null;

  for (let i = 1; i <= maxLookbackBlocks; i++) {
    const idx = blockIndex - i;
    if (idx < 0) break;
    const seed = baseSeed ^ idx;
    const rand = seededRandom(seed);
    if (rand < pOnline) {
      lastOnlineBlockIndex = idx;
      break;
    }
  }

  if (lastOnlineBlockIndex == null) {
    return {
      status: "offline",
      lastSeenMinutesAgo: null,
    };
  }

  const blocksAgo = blockIndex - lastOnlineBlockIndex;
  const minutesAgo = blocksAgo * blockSizeMinutes;

  if (minutesAgo <= 60) {
    return {
      status: "recently_online",
      lastSeenMinutesAgo: minutesAgo,
    };
  }

  return {
    status: "offline",
    lastSeenMinutesAgo: minutesAgo,
  };
}

