export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: string;
  plays?: number;
}

export interface Playlist {
  id: string;
  name: string;
  coverArt: string;
  songCount: number;
  curator?: string;
}

export interface Artist {
  id: string;
  name: string;
  profileImage: string;
  followers: number;
  genre: string;
}
