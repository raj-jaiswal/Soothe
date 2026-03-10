import { ActiveMoodCard } from '@/components/index/ActiveMoodCard';
import { SpinWheel, WHEEL_RADIUS } from '@/components/index/SpinWheel';
import { MOODS } from '@/constants/moods';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_HEIGHT = 72;
const PILL_VERTICAL_OFFSET = -60;
const MAX_RECENT = 10;
const MAX_SHOWN = 7;

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(3);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [headerBottom, setHeaderBottom] = useState(60);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const activeMood = MOODS[activeIndex];

  const pillTop = WHEEL_RADIUS - CARD_HEIGHT / 2 + PILL_VERTICAL_OFFSET;
  const pillLeft = SCREEN_WIDTH - WHEEL_RADIUS;

  const openSearch = () => {
    setSearchOpen(true);
    Animated.spring(dropdownAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText('');
    dropdownAnim.setValue(0);
    Keyboard.dismiss();
  };

  const submitSearch = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    console.log(`🔍 Search submitted: "${trimmed}"`);
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== trimmed);
      const updated = [trimmed, ...filtered];
      if (updated.length > MAX_RECENT) updated.pop();
      return updated;
    });
    closeSearch();
  };

  const deleteRecent = (item: string) => {
    console.log(`🗑️ Deleted recent search: "${item}"`);
    setRecentSearches(prev => prev.filter(s => s !== item));
  };

  const selectRecent = (item: string) => {
    console.log(`📌 Selected recent search: "${item}"`);
    setSearchText(item);
    inputRef.current?.focus();
  };

  const dropdownOpacity = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dropdownTranslateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      {/* Tap outside overlay — behind header, above wheel */}
      {searchOpen && (
        <TouchableWithoutFeedback onPress={closeSearch}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      )}

      {/* Header — always same height, never moves */}
      <View
        style={styles.header}
        onLayout={e => {
          const { y, height } = e.nativeEvent.layout;
          setHeaderBottom(y + height);
        }}
      >
        {searchOpen ? (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search moods..."
              placeholderTextColor="#666"
              returnKeyType="search"
              onSubmitEditing={submitSearch}
              autoCorrect={false}
              autoFocus={true}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={closeSearch} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.greeting}>
                Good Morning <Text style={styles.greetingBold}>Sravan</Text>
              </Text>
              <Text style={styles.subtitle}>How's your mood today?</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} activeOpacity={0.7} onPress={openSearch}>
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Wheel — always in same position, dropdown floats above it */}
      <View style={styles.wheelArea}>
        <SpinWheel
          moods={MOODS}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />
        <View
          style={[styles.pillOverlay, { top: pillTop, left: pillLeft }]}
          pointerEvents="box-none"
        >
          <ActiveMoodCard
            mood={activeMood}
            onPlay={() => console.log(`▶️ Playing: ${activeMood.label}`)}
          />
        </View>
      </View>

      {/* Dropdown — absolute overlay, floats over wheel, never affects layout */}
      {searchOpen && recentSearches.length > 0 && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              top: headerBottom + 4,
              opacity: dropdownOpacity,
              transform: [{ translateY: dropdownTranslateY }],
            },
          ]}
        >
          <FlatList
            data={recentSearches.slice(0, MAX_SHOWN)}
            keyExtractor={item => item}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={recentSearches.length > MAX_SHOWN}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentItem}
                activeOpacity={0.7}
                onPress={() => selectRecent(item)}
              >
                <Ionicons name="time-outline" size={16} color="#666" style={styles.recentIcon} />
                <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
                <TouchableOpacity
                  onPress={() => deleteRecent(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="close" size={16} color="#555" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 10,
  },
  greeting: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  greetingBold: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  searchButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 0,
  },
  cancelButton: {
    marginLeft: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 15,
  },
  wheelArea: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  pillOverlay: {
    position: 'absolute',
    right: 16,
    height: CARD_HEIGHT + 120,
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    zIndex: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  deleteButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 44,
  },
});