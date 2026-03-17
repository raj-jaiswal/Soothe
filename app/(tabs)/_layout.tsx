import FloatingTabBar from "@/components/FloatingTabBar";
import {
  SongPlayerProvider,
  useSongPlayer,
} from "@/components/index/SongPlayerContext";
import SongPlayerScreen from "@/components/index/SongPlayerScreen";
import { Tabs } from "expo-router";
import React from "react";
import { Modal, StyleSheet, View } from "react-native";

function TabsWithPlayer() {
  const { activeSong, closeSong } = useSongPlayer();

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="playlist" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="chats" />
        <Tabs.Screen name="profile" />
      </Tabs>

      {/* Modal renders in a native window — above absolutely everything */}
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
    </View>
  );
}

export default function TabLayout() {
  return (
    <SongPlayerProvider>
      <TabsWithPlayer />
    </SongPlayerProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C1C1C' },
});