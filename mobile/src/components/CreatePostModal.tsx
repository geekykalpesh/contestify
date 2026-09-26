import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Upload, PlusCircle, CheckCircle2, Film } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CATEGORIES = [
  'Tech',
  'Art',
  'Music',
  'Gaming',
  'Fitness',
  'Food',
  'Travel',
  'Fashion',
  'Education',
  'Entertainment',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Tech');
  const [mediaAsset, setMediaAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Permission to access media library is required!', 'Permission Denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaAsset(result.assets[0]);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast.warning('Please log in to post a reel!', 'Authentication Required');
      return;
    }
    if (!mediaAsset) {
      toast.warning('Please select a video or image file to upload', 'Media Required');
      return;
    }
    if (!caption.trim()) {
      toast.warning('Please add a caption for your reel', 'Caption Required');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('caption', caption.trim());
      formData.append('category', category);

      const filename = mediaAsset.uri.split('/').pop() || 'upload.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = mediaAsset.type === 'video' ? `video/${match ? match[1] : 'mp4'}` : `image/${match ? match[1] : 'jpg'}`;

      formData.append('media', {
        uri: mediaAsset.uri,
        name: filename,
        type,
      } as any);

      await userApi.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('🎉 Reel posted successfully!', 'Post Created');
      setCaption('');
      setMediaAsset(null);
      onClose();
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create reel post', 'Upload Failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
        {/* Header */}
        <View style={[styles.headerBar, isDark ? styles.darkBorder : styles.lightBorder]}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <X size={20} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark ? styles.whiteText : styles.blackText]}>
            Create Reel
          </Text>
          <TouchableOpacity
            onPress={handleCreatePost}
            disabled={uploading || !mediaAsset || !caption.trim()}
            style={[styles.postBtn, (!mediaAsset || !caption.trim() || uploading) && styles.disabledBtn]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.postBtnText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
          {/* Media Select Box */}
          <TouchableOpacity
            style={[
              styles.mediaPickerBox,
              isDark ? styles.darkPickerBox : styles.lightPickerBox,
              !mediaAsset && styles.dashedBorder,
            ]}
            onPress={handlePickMedia}
            activeOpacity={0.8}
          >
            {mediaAsset ? (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: mediaAsset.uri }} style={styles.previewImage} />
                <View style={styles.mediaTag}>
                  <Film size={14} color="#ffffff" />
                  <Text style={styles.mediaTagText}>
                    {mediaAsset.type === 'video' ? 'Video Attached' : 'Photo Attached'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <Upload size={28} color="#0095f6" />
                </View>
                <Text style={[styles.uploadTitle, isDark ? styles.whiteText : styles.blackText]}>
                  Select Video or Image
                </Text>
                <Text style={[styles.uploadSub, isDark ? styles.mutedDark : styles.mutedLight]}>
                  Tap to browse camera roll
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark ? styles.whiteText : styles.blackText]}>
              Reel Caption
            </Text>
            <TextInput
              style={[
                styles.captionInput,
                isDark ? styles.darkInput : styles.lightInput,
                isDark ? styles.whiteText : styles.blackText,
              ]}
              placeholder="Write a caption for your reel... #Contestify"
              placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark ? styles.whiteText : styles.blackText]}>
              Select Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    category === cat
                      ? styles.catPillActive
                      : isDark
                      ? styles.catPillDark
                      : styles.catPillLight,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catText,
                      category === cat
                        ? styles.catTextActive
                        : isDark
                        ? styles.whiteText
                        : styles.blackText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  darkBorder: {
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderBottomColor: '#e4e4e7',
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  postBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    gap: 20,
  },
  mediaPickerBox: {
    width: '100%',
    aspectRatio: 9 / 12,
    maxHeight: 380,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkPickerBox: {
    backgroundColor: '#18181b',
  },
  lightPickerBox: {
    backgroundColor: '#f4f4f5',
  },
  dashedBorder: {
    borderWidth: 2,
    borderColor: '#3f3f46',
    borderStyle: 'dashed',
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mediaTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 149, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  uploadSub: {
    fontSize: 12,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  captionInput: {
    borderRadius: 16,
    padding: 14,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  darkInput: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lightInput: {
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  catScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  catPillDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  catPillLight: {
    backgroundColor: '#f4f4f5',
    borderColor: '#e4e4e7',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
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
