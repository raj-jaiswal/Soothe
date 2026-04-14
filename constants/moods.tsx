import { ImageSourcePropType } from "react-native";

export interface MoodItem {
  id: string;
  label: string;
  image: ImageSourcePropType;
  colors: [string, string, string];
}

export const MOODS: MoodItem[] = [
  {
    id: "angry",
    label: "Angry",
    image: require("@/assets/images/index_page/angry.png"),
    colors: ["#7B0000", "#C0392B", "#E74C3C"],
  },
  {
    id: "calm",
    label: "Calm",
    image: require("@/assets/images/index_page/calm.png"),
    colors: ["#383a1a", "#27AE60", "#2ECC71"],
  },
  {
    id: "love",
    label: "Love",
    image: require("@/assets/images/index_page/love.png"),
    colors: ["#972655", "#B5174F", "#E0237A"],
  },
  {
    id: "upbeat",
    label: "Upbeat",
    image: require("@/assets/images/index_page/upbeat.png"),
    colors: ["#3B006B", "#6A0DAD", "#9B59B6"],
  },
  {
    id: "euphoric",
    label: "Euphoric",
    image: require("@/assets/images/index_page/euphoric.png"),
    colors: ["#B45309", "#D97706", "#F59E0B"],
  },
  {
    id: "grief",
    label: "Grief",
    image: require("@/assets/images/index_page/grief.png"),
    colors: ["#2C3E50", "#4A5568", "#718096"],
  },
  {
    id: "anxious",
    label: "Anxious",
    image: require("@/assets/images/index_page/anxious.png"),
    colors: ["#5f9a46", "#7db864", "#b0f194"],
  },
];
