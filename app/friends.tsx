import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Person = {
  id: string;
  name: string;
  handle: string;
  note: string;
};

type FriendsSection = {
  title: string;
  variant: "pending" | "friend";
  data: Person[];
};

const PENDING_REQUESTS: Person[] = [
  {
    id: "p1",
    name: "Arvind Kumar",
    handle: "@arvind",
    note: "Sent you a request",
  },
  {
    id: "p2",
    name: "Madhav Singh",
    handle: "@madhav",
    note: "Sent you a request",
  },
  { id: "p3", name: "Riya Shah", handle: "@riya", note: "Sent you a request" },
];

const FRIENDS: Person[] = [
  {
    id: "f1",
    name: "Rahul Singla",
    handle: "@rahul",
    note: "",
  },
  {
    id: "f2",
    name: "Piyush Singh",
    handle: "@piyush",
    note: "",
  },
  {
    id: "f3",
    name: "Mrinalini",
    handle: "@mrinalini",
    note: "",
  },
  {
    id: "f4",
    name: "Akshara Sen",
    handle: "@akshara",
    note: "",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PersonRow({
  item,
  variant,
}: {
  item: Person;
  variant: "pending" | "friend";
}) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.handle}>{item.handle}</Text>
        {variant === "pending" && <Text style={styles.note}>{item.note}</Text>}
      </View>

      {variant === "pending" ? (
        <View style={styles.actionRow}>
          <Pressable style={styles.acceptBtn}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn}>
            <Ionicons name="close-outline" size={22} color="#8b8b8b" />
          </Pressable>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={22} color="#8b8b8b" />
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const sections: FriendsSection[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filter = (items: Person[]) =>
      items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q),
      );

    return [
      {
        title: "Pending Requests",
        variant: "pending",
        data: q ? filter(PENDING_REQUESTS) : PENDING_REQUESTS,
      },
      {
        title: "Friends",
        variant: "friend",
        data: q ? filter(FRIENDS) : FRIENDS,
      },
    ];
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>

          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#bdbdbd" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Add friend"
              placeholderTextColor="#8d8d8d"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }: any) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item, section }: any) => (
            <PersonRow item={item} variant={section.variant} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 22 }} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#151515",
    paddingTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#151515",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#222",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2c2c2c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  textBlock: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  handle: {
    color: "#a6a6a6",
    marginTop: 2,
    fontSize: 13,
  },
  note: {
    color: "#d0d0d0",
    marginTop: 5,
    fontSize: 12,
  },
  acceptBtn: {
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptBtnText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cancelBtn: {
    padding: 6,
  },
});
