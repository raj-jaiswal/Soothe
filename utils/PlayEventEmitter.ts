/**
 * PlayEventEmitter — a tiny global event bus.
 * Any screen can emit "songPlayed" and any listener (e.g. profile.tsx) 
 * will be notified immediately without a page refresh.
 */

import { Song } from "@/components/index/SongPlayerContext";

type Listener = (song: Song) => void;

const listeners = new Set<Listener>();

export const PlayEventEmitter = {
  /** Call this whenever a song starts playing */
  emit(song: Song) {
    listeners.forEach((fn) => fn(song));
  },

  /** Subscribe to song-played events. Returns an unsubscribe function. */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
