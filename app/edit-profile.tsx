import { useAppTheme } from "@/components/context/ThemeContext";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export default function EditProfileScreen() {
  const router = useRouter();
  const { currentMood } = useAppTheme();

  const [displayName, setDisplayName] = useState("");
  const [statusLine, setStatusLine] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}user/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsername(data.username || "");
        setDisplayName(data.fullname || data.name || data.username || "");
        setStatusLine(data.bio || "");
        setProfileImage(data.profileImage || "");
      }
    } catch (error) {
      console.error("Error loading profile", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const saveProfile = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a name.");
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}user/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullname: trimmedName,
          bio: statusLine,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.back();
      } else {
        Alert.alert("Save failed", data.error || "Could not update profile.");
      }
    } catch (error) {
      console.error("Error saving profile", error);
      Alert.alert("Save failed", "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    try {
      setUploadingImage(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const filename = uri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      // @ts-ignore
      formData.append("profileImage", { uri, name: filename, type });

      const res = await fetch(`${BACKEND_URL}user/me/profile-pic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProfileImage(data.profileImage);
        setPreviewImage(null);
      } else {
        Alert.alert("Upload failed", data.error || "Unable to upload photo.");
      }
    } catch (error) {
      console.error("Error uploading profile image", error);
      Alert.alert("Upload failed", "Unable to upload photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Upload failed", "Could not read the selected image.");
        return;
      }

      setPreviewImage(asset.uri);
    } catch (error) {
      console.error("Error selecting image", error);
      Alert.alert("Upload failed", "Could not select image.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" color="white" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          style={[
            styles.saveButton,
            saving && { opacity: 0.7 },
            { backgroundColor: currentMood.colors[1] },
          ]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveLabel}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>?</Text>
            </View>
          )}
          <Text style={styles.sectionTitle}>Profile picture</Text>
          <Text style={styles.sectionDescription}>
            Tap below to upload a profile picture from your device.
          </Text>
          <Pressable
            style={[
              styles.uploadButton,
              { backgroundColor: currentMood.colors[1] },
            ]}
            onPress={pickProfileImage}
          >
            <Text style={styles.uploadLabel}>Change photo</Text>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your display name"
            placeholderTextColor="#999"
            value={displayName}
            onChangeText={setDisplayName}
            returnKeyType="done"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={`@${username}`}
            editable={false}
          />
          <Text style={styles.noteText}>Username cannot be changed.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Status line</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Your status line"
            placeholderTextColor="#999"
            value={statusLine}
            onChangeText={setStatusLine}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={currentMood.colors[1]}
            style={{ marginTop: 20 }}
          />
        ) : null}
      </ScrollView>

      {/* CUSTOM PREVIEW MODAL */}
      <Modal visible={!!previewImage} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Preview Avatar</Text>

            <View
              style={[
                styles.previewCropContainer,
                { borderColor: currentMood.colors[1] },
              ]}
            >
              {previewImage && (
                <Image
                  source={{ uri: previewImage }}
                  style={styles.previewImageContent}
                />
              )}
            </View>

            <Text style={styles.modalSubtitle}>
              This is how your photo will look.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setPreviewImage(null)}
                disabled={uploadingImage}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalConfirmButton,
                  uploadingImage && { opacity: 0.7 },
                  { backgroundColor: currentMood.colors[1] },
                ]}
                onPress={() => previewImage && uploadProfileImage(previewImage)}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Upload</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#151515",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  avatarContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 28,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 14,
    backgroundColor: "#333",
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarFallbackText: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionDescription: {
    color: "#aaa",
    textAlign: "center",
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#1d1d1d",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  uploadButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
  },
  uploadLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  disabledInput: {
    opacity: 0.6,
  },
  multilineInput: {
    minHeight: 96,
  },
  noteText: {
    color: "#888",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#1d1d1d",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  previewCropContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 4,
    backgroundColor: "#333",
  },
  previewImageContent: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalSubtitle: {
    color: "#aaa",
    marginTop: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#333",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
