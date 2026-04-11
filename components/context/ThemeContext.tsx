import { MOODS, MoodItem } from "@/constants/moods";
import React, { createContext, useContext, useState } from "react";

// Start with Upbeat
const defaultMood = MOODS.find((m) => m.id === "upbeat") || MOODS[0];

interface ThemeContextType {
  currentMood: MoodItem;
  setAppMood: (mood: MoodItem) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  currentMood: defaultMood,
  setAppMood: () => {},
});

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentMood, setCurrentMood] = useState<MoodItem>(defaultMood);

  return (
    <ThemeContext.Provider value={{ currentMood, setAppMood: setCurrentMood }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
