import { Song } from './types';
import anxiousSongs from './anxious';
import angrySongs from './angry';
import calmSongs from './calm';
import loveSongs from './love';
import upbeatSongs from './upbeat';
import euphoricSongs from './euphoric';
import griefSongs from './grief';

export type { Song };

// Add new genres here — key must match mood id (lowercase)
const MOOD_SONGS: Record<string, Song[]> = {
  anxious:  anxiousSongs,
  angry:    angrySongs,
  calm:     calmSongs,
  love:     loveSongs,
  upbeat:   upbeatSongs,
  euphoric: euphoricSongs,
  grief:    griefSongs,
};

export default MOOD_SONGS;
