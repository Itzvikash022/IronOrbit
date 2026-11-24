export type PlatformGameStatus = 'live' | 'soon';

export interface PlatformGame {
  id: string;
  title: string;
  tagline: string;
  status: PlatformGameStatus;
}

/** Catalog for the multi-game hub. Tournament / shared points come later. */
export const PLATFORM_GAMES: PlatformGame[] = [
  {
    id: 'iron-orbit',
    title: 'Iron Orbit',
    tagline: 'Top-down tank arena. Spin, fire, capture the flag.',
    status: 'live',
  },
  {
    id: 'coming-soon-a',
    title: 'Signal Drift',
    tagline: 'Next arena entry — locked for now.',
    status: 'soon',
  },
  {
    id: 'coming-soon-b',
    title: 'Gridlock',
    tagline: 'Another title for the shared series.',
    status: 'soon',
  },
];
