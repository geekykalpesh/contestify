import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, User as UserIcon, MessageSquare } from 'lucide-react-native';
import { userApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../config';
import { router } from 'expo-router';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ users: any[]; posts: any[] }>({ users: [], posts: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.get(`/posts/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data || { users: [], posts: [] });
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = (username: string) => {
    onClose();
    router.push(`/profile/${username}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
        {/* Search Input Bar */}
        <View style={[styles.headerBar, isDark ? styles.darkBorder : styles.lightBorder]}>
          <View style={[styles.inputBox, isDark ? styles.darkInput : styles.lightInput]}>
            <Search size={18} color={isDark ? '#a1a1aa' : '#71717a'} />
            <TextInput
              style={[styles.input, isDark ? styles.whiteText : styles.blackText]}
              placeholder="Search creators, posts or categories..."
              placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color={isDark ? '#a1a1aa' : '#71717a'} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, isDark ? styles.whiteText : styles.blackText]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0095f6" />
            <Text style={[styles.loadingText, isDark ? styles.mutedDark : styles.mutedLight]}>
              Searching creators & reels...
            </Text>
          </View>
        ) : !query.trim() ? (
          <View style={styles.centerContainer}>
            <Search size={40} color={isDark ? '#3f3f46' : '#d4d4d8'} />
            <Text style={[styles.emptyTitle, isDark ? styles.whiteText : styles.blackText]}>
              Search Contestify
            </Text>
            <Text style={[styles.emptySub, isDark ? styles.mutedDark : styles.mutedLight]}>
              Find top video creators, viral reels, and category tags.
            </Text>
          </View>
        ) : results.users.length === 0 && results.posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyTitle, isDark ? styles.whiteText : styles.blackText]}>
              No Results Found
            </Text>
            <Text style={[styles.emptySub, isDark ? styles.mutedDark : styles.mutedLight]}>
              No creators or posts matched "{query}".
            </Text>
          </View>
        ) : (
          <FlatList
            data={[
              ...results.users.map((u) => ({ ...u, _type: 'user' })),
              ...results.posts.map((p) => ({ ...p, _type: 'post' })),
            ]}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              if (item._type === 'user') {
                const username = item.username || item.email?.split('@')[0];
                return (
                  <TouchableOpacity
                    style={[styles.resultItem, isDark ? styles.darkBorder : styles.lightBorder]}
                    onPress={() => handleSelectUser(username)}
                  >
                    <View style={styles.avatarBox}>
                      {item.avatarUrl ? (
                        <Image source={{ uri: getMediaUrl(item.avatarUrl) }} style={styles.avatarImg} />
                      ) : (
                        <UserIcon size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemTitle, isDark ? styles.whiteText : styles.blackText]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemSub, isDark ? styles.mutedDark : styles.mutedLight]}>
                        @{username} • {item.residency || 'Creator'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <View style={[styles.resultItem, isDark ? styles.darkBorder : styles.lightBorder]}>
                  <MessageSquare size={20} color="#0095f6" />
                  <View style={styles.itemInfo}>
                    <Text
                      style={[styles.itemTitle, isDark ? styles.whiteText : styles.blackText]}
                      numberOfLines={1}
                    >
                      {item.caption || 'Reel Post'}
                    </Text>
                    <Text style={[styles.itemSub, isDark ? styles.mutedDark : styles.mutedLight]}>
                      Category: {item.category} • Likes: {item.likeCount || 0}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBg: {
    backgroundColor: '#000000',
  },
  lightBg: {
    backgroundColor: '#ffffff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  darkBorder: {
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderBottomColor: '#e4e4e7',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  darkInput: {
    backgroundColor: '#18181b',
  },
  lightInput: {
    backgroundColor: '#f4f4f5',
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  cancelBtn: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
  mutedDark: {
    color: '#a1a1aa',
  },
  mutedLight: {
    color: '#71717a',
  },
});
