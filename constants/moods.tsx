import { ImageSourcePropType } from 'react-native';

export interface MoodItem {
  id: string;
  label: string;
  image: ImageSourcePropType;
  /** Gradient colors for the active pill card */
  colors: [string, string, string];
}

export const MOODS: MoodItem[] = [
  {
    id: 'anxious',
    label: 'Anxious',
    image: require('@/assets/images/index_page/anxious.png'),
    colors: ['#2C3E50', '#4A5568', '#718096'],
  },
  {
    id: 'angry',
    label: 'Angry',
    image: require('@/assets/images/index_page/angry.png'),
    colors: ['#7B0000', '#C0392B', '#E74C3C'],
  },
  {
    id: 'calm',
    label: 'Calm',
    image: require('@/assets/images/index_page/calm.png'),
    colors: ['#1A3A2A', '#27AE60', '#2ECC71'],
  },
  {
    id: 'love',
    label: 'Love',
    image: require('@/assets/images/index_page/love.png'),
    colors: ['#6B1237', '#B5174F', '#E0237A'],
  },
  {
    id: 'upbeat',
    label: 'Upbeat',
    image: require('@/assets/images/index_page/upbeat.png'),
    colors: ['#3B006B', '#6A0DAD', '#9B59B6'],
  },
  {
    id: 'euphoric',
    label: 'Euphoric',
    image: require('@/assets/images/index_page/euphoric.png'),
    colors: ['#B45309', '#D97706', '#F59E0B'],
  },
  {
    id: 'grief',
    label: 'Grief',
    image: require('@/assets/images/index_page/grief.png'),
    colors: ['#1A1A2E', '#16213E', '#4A5568'],
  },
];