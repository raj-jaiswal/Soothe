import { Song, Playlist, Artist } from './ExploreTypes';

export const RECENT_SONGS: Song[] = [
  {
    id: '1',
    title: 'Two Oruguitas',
    artist: 'Sebastián Yatra',
    albumArt: 'https://picsum.photos/seed/song1/200/200',
    duration: '4:12',
    plays: 2100000,
  },
  {
    id: '2',
    title: 'Saath Nibhana Saathiya',
    artist: 'Rekha Bharadwaj',
    albumArt: 'https://picsum.photos/seed/song2/200/200',
    duration: '5:34',
    plays: 1800000,
  },
  {
    id: '3',
    title: 'Tere Bina',
    artist: 'A.R. Rahman',
    albumArt: 'https://picsum.photos/seed/song3/200/200',
    duration: '4:55',
    plays: 3200000,
  },
  {
    id: '4',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    albumArt: 'https://picsum.photos/seed/song4/200/200',
    duration: '4:28',
    plays: 5100000,
  },
  {
    id: '5',
    title: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal',
    albumArt: 'https://picsum.photos/seed/song5/200/200',
    duration: '3:58',
    plays: 4400000,
  },
];

export const TOP_PLAYLISTS: Playlist[] = [
  {
    id: '1',
    name: 'Midnight Vibes',
    coverArt: 'https://picsum.photos/seed/pl1/300/300',
    songCount: 32,
    curator: 'Sravan',
  },
  {
    id: '2',
    name: 'Lo-Fi Focus',
    coverArt: 'https://picsum.photos/seed/pl2/300/300',
    songCount: 47,
    curator: 'Piyush',
  },
  {
    id: '3',
    name: 'Bollywood Classics',
    coverArt: 'https://picsum.photos/seed/pl3/300/300',
    songCount: 64,
    curator: 'Mrinalini',
  },
  {
    id: '4',
    name: 'Heartbreak Hotel',
    coverArt: 'https://picsum.photos/seed/pl4/300/300',
    songCount: 28,
    curator: 'Aradhana',
  },
];

export const TOP_ARTISTS: Artist[] = [
  {
    id: '1',
    name: 'Arijit Singh',
    profileImage: 'https://picsum.photos/seed/ar1/200/200',
    followers: 12400000,
    genre: 'Bollywood',
  },
  {
    id: '2',
    name: 'A.R. Rahman',
    profileImage: 'https://picsum.photos/seed/ar2/200/200',
    followers: 9800000,
    genre: 'World / Indie',
  },
  {
    id: '3',
    name: 'Shreya Ghoshal',
    profileImage: 'https://picsum.photos/seed/ar3/200/200',
    followers: 8300000,
    genre: 'Bollywood',
  },
  {
    id: '4',
    name: 'Jubin Nautiyal',
    profileImage: 'https://picsum.photos/seed/ar4/200/200',
    followers: 6700000,
    genre: 'Pop / Bollywood',
  },
  {
    id: '5',
    name: 'Neha Kakkar',
    profileImage: 'https://picsum.photos/seed/ar5/200/200',
    followers: 7100000,
    genre: 'Pop',
  },
];
