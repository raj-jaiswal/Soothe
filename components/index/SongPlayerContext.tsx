import React, { createContext, useContext, useState } from 'react';
import { Song } from './SongPlayerScreen';

interface SongPlayerContextType {
  openSong: (song: Song) => void;
  closeSong: () => void;
  activeSong: Song | null;
}

const SongPlayerContext = createContext<SongPlayerContextType>({
  openSong: () => {},
  closeSong: () => {},
  activeSong: null,
});

export const useSongPlayer = () => useContext(SongPlayerContext);

export function SongPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  const openSong  = (song: Song) => setActiveSong(song);
  const closeSong = ()           => setActiveSong(null);

  return (
    <SongPlayerContext.Provider value={{ openSong, closeSong, activeSong }}>
      {children}
    </SongPlayerContext.Provider>
  );
}