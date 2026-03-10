import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function FloatingTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Explore */}
        <TabIcon
          icon="compass-outline"
          onPress={() => navigation.navigate("explore")}
        />

        {/* Playlist */}
        <TabIcon
          icon="list-outline"
          onPress={() => navigation.navigate("playlist")}
        />

        {/* Home (center button) */}
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => navigation.navigate("index")}
        >
          <Ionicons name="pulse" size={26} color="white" />
        </TouchableOpacity>

        {/* Chats */}
        <TabIcon
          icon="chatbubble-outline"
          onPress={() => navigation.navigate("chats")}
        />

        {/* Profile */}
        <TabIcon
          icon="person-outline"
          onPress={() => navigation.navigate("profile")}
        />
      </View>
    </View>
  );
}

function TabIcon({ icon, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Ionicons name={icon} size={22} color="#222" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    alignItems: "center",
  },

  container: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    height: 65,
    borderRadius: 35,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  centerButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#7B2FF7",
    width: 65,
    height: 65,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
  },
});
