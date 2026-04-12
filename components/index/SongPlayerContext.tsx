import React, { createContext, useContext, useState } from 'react';
import { Song } from './SongPlayerScreen';
import { PlayEventEmitter } from '@/utils/PlayEventEmitter';

interface SongPlayerContextType {
  openSong: (song: Song) => void;
  closeSong: () => void;
  activeSong: Song | null;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  coverUri?: string;
  moods?: string;
}

const SongPlayerContext = createContext<SongPlayerContextType>({
  openSong: () => {},
  closeSong: () => {},
  activeSong: null,
});

export const useSongPlayer = () => useContext(SongPlayerContext);

export function SongPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  const openSong  = (song: Song) => { setActiveSong(song); PlayEventEmitter.emit(song); };
  const closeSong = ()           => setActiveSong(null);

  return (
    <SongPlayerContext.Provider value={{ openSong, closeSong, activeSong }}>
      {children}
    </SongPlayerContext.Provider>
  );
}