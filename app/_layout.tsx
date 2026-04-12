import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AppThemeProvider } from "@/components/context/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SongPlayerProvider, useSongPlayer } from "@/components/index/SongPlayerContext";
import SongPlayerScreen from "@/components/index/SongPlayerScreen";
import { Modal } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppThemeProvider>
      <SongPlayerProvider>
        <RootLayoutContent colorScheme={colorScheme} />
      </SongPlayerProvider>
    </AppThemeProvider>
  );
}

function RootLayoutContent({ colorScheme }: { colorScheme: any }) {
  const { activeSong, closeSong } = useSongPlayer();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />

        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen name="friends" options={{ headerShown: false }} />
        <Stack.Screen name="mood-results" options={{ headerShown: false }} />
      </Stack>

      <Modal
        visible={!!activeSong}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSong}
      >
        {activeSong && (
          <SongPlayerScreen song={activeSong} onBack={closeSong} />
        )}
      </Modal>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
