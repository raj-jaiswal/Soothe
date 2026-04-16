# Soothe Frontend

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [Navigation Structure](#navigation-structure)
- [Key Components](#key-components)
- [Context & State Management](#context--state-management)
- [Real-Time Features](#real-time-features)
- [API Integration](#api-integration)
- [Styling & Theme](#styling--theme)
- [Scripts](#scripts)
- [Building for Distribution](#building-for-distribution)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

**Soothe** is a comprehensive mobile music streaming and social platform frontend built with React Native and Expo. It enables users to discover music based on their mood, manage playlists, interact with friends, and enjoy real-time chat functionality. The application provides a seamless, intuitive interface for mood-based music consumption with end-to-end encrypted messaging.

The frontend supports both iOS and Android platforms through a single codebase, ensuring consistent user experience across devices.

---

## Tech Stack

### Core Framework
- **React Native** (v0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.33) - Managed React Native framework
- **Expo Router** (~6.0.23) - File-based routing (like Next.js)
- **TypeScript** (~5.9.2) - Type-safe development

### Navigation
- **@react-navigation/native** (^7.1.8) - Core navigation
- **@react-navigation/bottom-tabs** (^7.4.0) - Tab navigation
- **@react-navigation/elements** (^2.6.3) - Navigation components

### State Management & Storage
- **React Context API** - Theme and app-wide state
- **@react-native-async-storage/async-storage** (2.2.0) - Local data persistence

### Media & Audio
- **expo-av** (^16.0.8) - Audio/video playback
- **expo-audio** (~1.1.1) - Audio recording and playback
- **expo-image** (~3.0.11) - Optimized image rendering
- **expo-image-picker** (~17.0.10) - Image selection from device

### UI & Graphics
- **expo-linear-gradient** (~15.0.8) - Gradient backgrounds
- **react-native-linear-gradient** (^2.8.3) - Additional gradient support
- **react-native-svg** (15.12.1) - SVG support
- **react-native-gifted-charts** (^1.4.76) - Chart/graph rendering
- **@expo/vector-icons** (^15.0.3) - Icon library

### Networking & Real-Time
- **axios** (^1.14.0) - HTTP client for API requests
- **socket.io-client** (^4.8.3) - Real-time WebSocket communication
- **jwt-decode** (^4.0.0) - JWT token parsing

### Security & Utilities
- **crypto-js** (^4.2.0) - End-to-end message encryption
- **react-native-get-random-values** (~1.11.0) - Cryptographic randomness
- **expo-constants** (~18.0.13) - App constants and configuration
- **expo-haptics** (~15.0.8) - Haptic feedback
- **react-native-gesture-handler** (~2.28.0) - Gesture recognition
- **react-native-reanimated** (~4.1.1) - Smooth animations
- **react-native-screens** (~4.16.0) - Native screen optimization

### Development
- **ESLint** (^9.25.0) - Code linting (Expo config)

---

## Features

1. **User Authentication**
   - Email/password registration with OTP verification
   - JWT-based session management
   - Automatic token refresh
   - Secure logout

2. **Mood-Based Music Discovery**
   - 6 distinct mood categories (Upbeat, Relaxed, Focus, Energetic, Romantic, Melancholic)
   - AI-powered song recommendations based on selected mood
   - Mood-specific color theming throughout the app
   - Dynamic playlist suggestions

3. **Music Playback**
   - Stream songs with adaptive quality
   - Play/pause/skip controls
   - Playlist queueing
   - Progress seeking
   - Volume control with haptic feedback

4. **Playlist Management**
   - Create and manage personal playlists
   - Add/remove songs from playlists
   - Rename playlists
   - Browse public community playlists
   - Share playlists with friends

5. **User Profiles**
   - Profile information management
   - Profile picture upload from device gallery
   - View listening history
   - Track top songs statistics
   - Edit profile settings

6. **Social Features**
   - Discover and search for other users
   - Send and accept friend requests
   - View friends list
   - Personal friends network
   - User discovery and recommendations

7. **Real-Time Chat**
   - End-to-end encrypted messaging with friends
   - Real-time message delivery via WebSocket
   - Chat history persistence
   - Typing indicators
   - Message sharing functionality
   - Multiple active chats

8. **Favorites System**
   - Add/remove favorite songs
   - Quick access to favorite songs
   - Persistent favorite collection

---

## Project Structure

```
soothe/
├── app/                                 # Expo Router app directory (file-based routing)
│   ├── _layout.tsx                     # Root layout with providers
│   ├── welcome.tsx                     # Onboarding/splash screen
│   ├── login.tsx                       # Login screen
│   ├── signup.tsx                      # Registration screen
│   ├── edit-profile.tsx                # Profile editor
│   ├── friends.tsx                     # Friend discovery and requests
│   ├── history.tsx                     # Listening history view
│   ├── mood-results.tsx                # Mood-based recommendations
│   ├── modal.tsx                       # Modal presentation
│   │
│   ├── (tabs)/                         # Tab-based navigation group
│   │   ├── _layout.tsx                 # Tab navigator setup
│   │   ├── index.tsx                   # Home/Now Playing tab
│   │   ├── explore.tsx                 # Music discovery tab
│   │   ├── playlist.tsx                # User playlists tab
│   │   ├── playlist-details.tsx        # Playlist content view
│   │   ├── chats.tsx                   # Chat list tab
│   │   ├── mic.tsx                     # Mood selection/input tab
│   │   ├── search.tsx                  # Search functionality
│   │   └── profile.tsx                 # User profile tab
│   │
│   └── messages/
│       ├── _layout.tsx                 # Messages stack layout
│       └── [id].tsx                    # Individual chat screen
│
├── components/                          # Reusable UI components
│   ├── external-link.tsx               # External link component
│   ├── haptic-tab.tsx                  # Haptic feedback tab button
│   ├── hello-wave.tsx                  # Welcome animation
│   ├── parallax-scroll-view.tsx        # Parallax scrolling component
│   ├── themed-text.tsx                 # Theme-aware text
│   ├── themed-view.tsx                 # Theme-aware container
│   ├── FloatingTabBar.tsx              # Custom tab bar UI
│   │
│   ├── auth/
│   │   └── SootheLogo.tsx              # App logo component
│   │
│   ├── chats/
│   │   ├── ChatListItem.tsx            # Chat list item UI
│   │   ├── StoriesRow.tsx              # Stories/recent contacts
│   │   └── StoryAvatar.tsx             # Story avatar display
│   │
│   ├── context/
│   │   └── ThemeContext.tsx            # Mood/theme context provider
│   │
│   ├── explore/
│   │   ├── ArtistCard.tsx              # Artist preview card
│   │   ├── PlaylistCard.tsx            # Playlist preview card
│   │   ├── RecentSongCard.tsx          # Recent song mini card
│   │   └── SectionHeader.tsx           # Explore section header
│   │
│   ├── index/
│   │   ├── ActiveMoodCard.tsx          # Current mood display
│   │   ├── MoodPlayerScreen.tsx        # Player with mood controls
│   │   ├── ShareWithFriendMenu.tsx     # Song sharing menu
│   │   ├── SongActionsMenu.tsx         # Song options menu
│   │   ├── SongPlayerContext.tsx       # Player state context
│   │   ├── SongPlayerScreen.tsx        # Main player UI
│   │   └── SpinWheel.tsx               # Mood selection wheel
│   │
│   ├── profile/
│   │   └── piechart.tsx                # Statistics pie chart
│   │
│   └── ui/
│       ├── collapsible.tsx             # Collapsible component
│       ├── icon-symbol.tsx             # Icon symbols
│       └── icon-symbol.ios.tsx         # iOS-specific icons
│
├── constants/                           # App constants and configuration
│   ├── moods.tsx                       # Mood definitions and colors
│   ├── theme.ts                        # App-wide theme configuration
│   │
│   └── explore/
│       ├── exploreMockData.ts          # Mock data for explore tab
│       └── ExploreTypes.ts             # Type definitions for explore
│
├── hooks/                               # Custom React hooks
│   ├── use-color-scheme.ts             # System color scheme detection
│   ├── use-color-scheme.web.ts         # Web color scheme detection
│   └── use-theme-color.ts              # Theme color management
│
├── utils/
│   └── PlayEventEmitter.ts             # Audio event emitter
│
├── assets/
│   ├── fonts/                          # Custom font files
│   └── images/
│       └── index_page/                 # Home screen images
│
├── app.json                             # Expo app configuration
├── babel.config.js                     # Babel configuration
├── metro.config.js                     # Metro bundler config
├── tsconfig.json                       # TypeScript configuration
├── eslint.config.js                    # ESLint rules
├── eas.json                            # Expo Application Services config
├── expo-env.d.ts                       # Expo environment types
├── svg.d.ts                            # SVG type declarations
├── package.json                        # Dependencies and scripts
├── withGradleFix.js                    # Android build fix plugin
└── README.md                           # This file
```

---

## Environment Variables

Create a `.env` file at the root of the project to configure API endpoints and services:

```env
# API Configuration
EXPO_PUBLIC_BACKEND_URL=http://<IP Address>:3000/api/
```

**Important:** In Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the client.

---

## Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** (`npm install -g expo-cli`)
- **Git** for version control
- For iOS: Xcode (on macOS) or Expo Go app
- For Android: Android Studio or Expo Go app

### Step 1: Clone the Repository

```bash
git clone https://github.com/raj-jaiswal/soothe.git
cd soothe
```

### Step 2: Install Dependencies

```bash
npm install
```

or with yarn:

```bash
yarn install
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your backend server URL:

```env
EXPO_PUBLIC_BACKEND_URL=http://<IP Address>:3000/api/
```

### Step 4: Start the Development Server

```bash
npm start
```

This launches the Expo CLI with a QR code for connecting mobile clients.

---

## Running the Project

### Development on Mobile (Expo Go)

1. **iOS:** Open Expo Go app → Scan QR code from terminal
2. **Android:** Open Expo Go app → Scan QR code from terminal

### Development on Web

```bash
npm run web
```

Opens the app in your browser at `http://localhost:19006`

### Development on Android (Physical Device or Emulator)

```bash
npm run android
```

Requires Android Studio and configured emulator or connected device.

### Development on iOS (Physical Device or Simulator)

```bash
npm run ios
```

Requires Xcode on macOS.

### Linting

Check code quality with ESLint:

```bash
npm run lint
```

This follows Expo's recommended ESLint configuration.

---

## Navigation Structure

The app uses **Expo Router** for file-based routing, similar to Next.js:

### Route Hierarchy

```
/ (Root)
├── welcome.tsx                 # Splash/onboarding
├── login.tsx                   # Login screen
├── signup.tsx                  # Registration screen
├── (tabs)                      # Authenticated user tabs
│   ├── index.tsx              # Now Playing (home)
│   ├── explore.tsx            # Music Discovery
│   ├── playlist.tsx           # My Playlists
│   ├── chats.tsx              # Chat List
│   ├── mic.tsx                # Mood Selection
│   ├── search.tsx             # Search Songs/Artists
│   └── profile.tsx            # User Profile
├── messages
│   └── [id].tsx               # Individual Chat
├── edit-profile.tsx           # Profile Editor
├── friends.tsx                # Friend Management
├── history.tsx                # Listening History
└── mood-results.tsx           # AI Recommendations
```

### Navigation Flow

1. **Authentication Flow:** welcome → login/signup → (tabs)
2. **From Tabs:** Any tab can navigate to messages, edit-profile, friends, history, or mood-results
3. **Deep Linking:** The app supports deep links defined in `app.json`

---

## Key Components

### Player Component (SongPlayerScreen)
Main music playback UI with:
- Song artwork display
- Play/pause/skip buttons
- Progress bar with seeking
- Volume control
- Current mood indicator
- Favorite song toggle
- Share options

### Mood Wheel (SpinWheel)
Interactive mood selector component with:
- 6 mood options with distinct colors
- Smooth rotation animation
- Visual feedback on selection
- Auto-triggers mood-based recommendations

### Chat Components
- **ChatListItem:** Shows last message, unread count, timestamp
- **StoriesRow:** Recent contacts for quick messaging
- **StoryAvatar:** User avatar with online/offline status

### Explore Cards
- **PlaylistCard:** Preview of public playlists with song count
- **ArtistCard:** Artist profile with follower count
- **RecentSongCard:** Compact song preview

### Profile Components
- **Piechart:** Visualize mood distribution of top songs
- Shows top genres, artists, and listening stats

---

## Context & State Management

### ThemeContext
Manages mood-based theming across the entire app.

**File:** components/context/ThemeContext.tsx

**Usage:**
```typescript
import { ThemeContext } from '@/components/context/ThemeContext';
const { currentMood, setAppMood } = useContext(ThemeContext);
```

**Key Functions:**
- `setAppMood(mood)` - Change the active mood and color scheme
- `currentMood` - Get current mood object with color and ID

### SongPlayerContext
Manages music playback state.

**File:** components/index/SongPlayerContext.tsx

**Includes:**
- Current playing song
- Player status (playing, paused, stopped)
- Play queue management
- Repeat/shuffle modes

### Local Storage (AsyncStorage)
Persists user data on device:
- JWT token for authentication
- User preferences
- Recently played songs
- Offline data cache

**Example:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('userToken', token);
const token = await AsyncStorage.getItem('userToken');
```

---

## Real-Time Features

### WebSocket Chat (Socket.io)

Real-time messaging with end-to-end encryption.

**Connection Setup:**
```typescript
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const token = await AsyncStorage.getItem('userToken');
const socket = io(process.env.EXPO_PUBLIC_SOCKET_URL, {
  auth: { token }
});
```

**Socket Events:**

```typescript
// Join a chat room
socket.emit('join', { chatId: 'chat_room_id' });

// Send encrypted message
socket.emit('sendMessage', {
  chatId: 'chat_room_id',
  recipientUsername: 'friend_username',
  ciphertext: CryptoJS.AES.encrypt(message, encryptionKey).toString(),
  iv: initializationVector,
  messageType: 'text'
});

// Listen for incoming messages
socket.on('message', (data) => {
  const decrypted = CryptoJS.AES.decrypt(data.ciphertext, encryptionKey).toString();
  console.log('New message:', decrypted);
});

// Handle disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

**End-to-End Encryption:**
Uses `crypto-js` library for AES encryption:

```typescript
import CryptoJS from 'crypto-js';

const message = 'Hello, World!';
const key = 'shared-secret-key';
const encrypted = CryptoJS.AES.encrypt(message, key).toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
```

---

## API Integration

### Axios Client Setup

The app uses Axios for all HTTP requests to the backend API.

**Base Configuration:**
```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

// Add JWT token to all requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      await AsyncStorage.removeItem('userToken');
      navigation.reset({ index: 0, routes: [{ name: 'login' }] });
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints Consumed

The frontend communicates with the Soothe backend API:

| Feature | Method | Endpoint |
|---------|--------|----------|
| **Auth** | POST | `/api/auth/signup` |
| | POST | `/api/auth/verify-otp` |
| | POST | `/api/auth/login` |
| **Songs** | GET | `/api/songs` |
| | GET | `/api/songs/:id/stream` |
| | POST | `/api/songs/suggest` |
| **User** | GET | `/api/user/me` |
| | GET | `/api/user/me/history` |
| | GET | `/api/user/me/top-songs` |
| | PUT | `/api/user/me` |
| | POST | `/api/user/me/profile-pic` |
| **Playlists** | POST | `/api/personal-playlists` |
| | GET | `/api/personal-playlists` |
| | PATCH | `/api/personal-playlists/:id` |
| | POST | `/api/personal-playlists/:id/songs` |
| | DELETE | `/api/personal-playlists/:id/songs/:songId` |
| **Favorites** | GET | `/api/favourites` |
| | POST | `/api/favourites/:songId` |
| | DELETE | `/api/favourites/:songId` |
| **Friends** | GET | `/api/friends/search` |
| | GET | `/api/friends` |
| | POST | `/api/friends/request` |
| | POST | `/api/friends/accept` |
| | POST | `/api/friends/reject` |
| **Chat** | GET | `/api/chats` |
| | GET | `/api/chats/:chatId/messages` |

See the [backend README](https://github.com/raj-jaiswal/Soothe-backend?tab=readme-ov-file#-api-documentation) for detailed endpoint documentation.

---

## Styling & Theme

### Mood-Based Color Theming

The app dynamically changes colors based on the selected mood.

**Mood Configuration:** constants/moods.tsx

```typescript
export interface MoodItem {
  id: string;
  label: string;
  color: string;
  accentColor: string;
  icon: string;
  description: string;
}
```

**Available Moods:**
-  **Upbeat** 
-  **Euphoric** 
-  **Love** 
-  **Angry** 
-  **Grief** 
-  **Anxious** 
-  **Calm** 

### Theme Configuration

**File:** constants/theme.ts

Defines:
- Font sizing
- Spacing scale
- Border radius
- Opacity values
- Animation durations

### Component Styling

Use themed components for consistency:

```typescript
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export function MyComponent() {
  return (
    <ThemedView>
      <ThemedText>This text adapts to the current mood!</ThemedText>
    </ThemedView>
  );
}
```

---

## Scripts

Available npm scripts defined in `package.json`:

### Running the App

```bash
npm start              # Start development server
npm run ios           # Run on iOS simulator/device
npm run android       # Run on Android emulator/device
npm run web           # Run in web browser
```

### Development & Maintenance

```bash
npm run lint          # Check code quality (ESLint)
npm run reset-project # Reset project to initial state
npm run clean         # Clear Android build cache
```

---

## Building for Distribution

### Expo Application Services (EAS)

The project is configured for EAS Build for seamless app store deployment.

**Configuration:** eas.json

### iOS Distribution

Build and upload to Apple App Store:

```bash
eas build --platform ios
```

### Android Distribution

Build and upload to Google Play Store:

```bash
eas build --platform android
```

### Prerequisites for Distribution

- **Expo account** (eas.expo.dev)
- **Apple Developer account** (iOS)
- **Google Play Developer account** (Android)
- Proper signing certificates and provisioning profiles

### Build Status

Check build progress in the Expo dashboard or terminal.

---

## Troubleshooting

### Common Issues

#### App Won't Connect to Backend
- **Issue:** Network timeout or connection refused
- **Solution:** 
  - Ensure backend is running on the correct port
  - Check `EXPO_PUBLIC_BACKEND_URL` in `.env`
  - For emulator, use `10.0.2.2:3000` (Android) or `localhost:3000` (iOS)
  - For physical device, use your machine's IP address

#### WebSocket Connection Failed
- **Issue:** Chat functionality not working
- **Solution:**
  - Verify backend supports Socket.io
  - Check `EXPO_PUBLIC_BACKEND_URL` matches backend URL
  - Ensure JWT token is valid before connecting

#### Audio Playback Issues
- **Issue:** Songs don't play or pause
- **Solution:**
  - Check audio permissions in `app.json`
  - Verify stream URL is accessible
  - For iOS: Check Background Modes in Xcode
  - For Android: Check microphone permissions

#### AsyncStorage Data Not Persisting
- **Issue:** User data/token disappears on app restart
- **Solution:**
  - AsyncStorage requires app closure to persist
  - For debugging, use Expo DevTools
  - Clear app cache: `npm run clean`

#### Build Fails on EAS
- **Issue:** EAS build succeeds but app crashes
- **Solution:**
  - Check `app.json` for configuration errors
  - Verify all native modules are compatible with Expo SDK version
  - Review EAS build logs in dashboard

#### Image Display Issues
- **Issue:** Images from API don't load
- **Solution:**
  - Use `expo-image` component for optimized loading
  - Ensure image URLs are accessible from the network
  - Check CORS headers on backend

### Debug Mode

Enable debug logs:

```typescript
import { setLoggingEnabled } from 'react-native';
setLoggingEnabled(true);
```

Use Expo DevTools:

```bash
npm start -- --dev-client
```

---

## Project Practices

### Code Structure
- **Screens** (app/) - Full page/route components
- **Components** - Reusable UI elements
- **Contexts** - State management
- **Utils** - Helper functions
- **Constants** - App-wide constants

### Naming Conventions
- React components: `PascalCase` (e.g., `SongPlayer.tsx`)
- Files: `kebab-case` or `PascalCase` matching component name
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### TypeScript
- All components and functions should have proper typing
- Avoid `any` type; use specific types or generics
- Define interfaces in separate files when needed

---

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test thoroughly on both iOS and Android
4. Run linting: `npm run lint`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## License

MIT License

---

## Contributors

- **Divya Swaroop Jaiswal** - https://github.com/raj-jaiswal
- **Darla Sravan Kumar** - https://github.com/DSK-champ
- **Vivekananda Katakam** - https://github.com/VivekanandaK123
- **Parth Agarwal** - https://github.com/parthagarwal8910
- **Vennela Jangiti** - https://github.com/vennelajangiti17
- **Shivam Prakash** - https://github.com/Phoenix1729398

---

## Related Repositories

- [Soothe Backend](https://github.com/raj-jaiswal/Soothe-backend)
