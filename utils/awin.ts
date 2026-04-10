const PUBLISHER_ID = '2836964';

const MERCHANTS: Record<string, { mid: string }> = {
  'diamond smile':    { mid: '27135'  },
  'laboratoires uma': { mid: '85413'  },
  'blissim':          { mid: '15574'  },
  'perfumeria comas': { mid: '105475' },
  'dr pierre ricaud': { mid: '6977'   },
  'pierre ricaud':    { mid: '6977'   },
  'foreo':            { mid: '73932'  },
};

export function getAwinLink(brand: string): string | null {
  const key = brand.toLowerCase().trim();
  const match = Object.keys(MERCHANTS).find(k => key.includes(k));
  if (!match) return null;
  const { mid } = MERCHANTS[match];
  return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${PUBLISHER_ID}`;
}