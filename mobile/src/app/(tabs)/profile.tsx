import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Grid,
  List,
  Settings,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Sparkles,
  Mail,
  Play,
  Heart,
  MessageSquare,
  Camera,
  Upload,
  ShieldCheck,
  AlertCircle,
  X,
  LogOut,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getMediaUrl, getMediaThumbnailUrl } from '../../config';
import { userApi } from '../../services/api';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, updateResidency, updateAvatar, updateKyc } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'grid' | 'feed' | 'kyc' | 'settings'>('grid');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Residency State
  const [residency, setResidency] = useState(user?.residency || 'Chhattisgarh');
  const [savingResidency, setSavingResidency] = useState(false);

  // KYC Form State
  const kycData = user?.kycDetails || {};
  const [aadharNumber, setAadharNumber] = useState(kycData.aadharNumber || '');
  const [aadharMobile, setAadharMobile] = useState(kycData.aadharMobile || '');
  const [dob, setDob] = useState(kycData.dob || '');
  const [aadharImageAsset, setAadharImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  useEffect(() => {
    fetchProfilePosts();
  }, [user]);

  const fetchProfilePosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await userApi.get('/posts/my-posts');
      setMyPosts(res.data.data?.posts || []);
      setStats(res.data.data?.stats || {});
    } catch (err) {
      console.error('Failed to fetch profile posts', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Permission required to access photos', 'Permission Denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      formData.append('avatar', {
        uri: asset.uri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      try {
        await updateAvatar(formData);
        toast.success('Profile picture updated!', 'Photo Updated');
      } catch (err: any) {
        toast.error('Failed to update avatar', 'Error');
      }
    }
  };

  const handlePickAadhaarImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Permission required to access photos', 'Permission Denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAadharImageAsset(result.assets[0]);
    }
  };

  const handleKycSubmit = async () => {
    const cleanAadhaar = aadharNumber.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      toast.error('Aadhaar Number must be 12 digits', 'Validation Error');
      return;
    }

    const cleanMobile = aadharMobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      toast.error('Mobile Number must be 10 digits', 'Validation Error');
      return;
    }

    if (!dob) {
      toast.error('Date of Birth is required', 'Validation Error');
      return;
    }

    try {
      setSubmittingKyc(true);
      const formData = new FormData();
      formData.append('aadharNumber', cleanAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3'));
      formData.append('aadharMobile', cleanMobile);
      formData.append('dob', dob);

      if (aadharImageAsset) {
        const filename = aadharImageAsset.uri.split('/').pop() || 'aadhaar.jpg';
        formData.append('aadharImage', {
          uri: aadharImageAsset.uri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      await updateKyc(formData);
      toast.success('KYC documents submitted for verification!', 'KYC Submitted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC', 'Error');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleResidencySubmit = async () => {
    try {
      setSavingResidency(true);
      await updateResidency(residency);
      toast.success('Residency status updated!', 'Profile Updated');
    } catch (err: any) {
      toast.error('Failed to update residency', 'Error');
    } finally {
      setSavingResidency(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
        <Header />
        <View style={styles.centerContainer}>
          <Text style={[styles.loginPromptTitle, isDark ? styles.whiteText : styles.blackText]}>
            View Your Creator Profile
          </Text>
          <Text style={[styles.loginPromptSub, isDark ? styles.mutedDark : styles.mutedLight]}>
            Log in to manage your reels grid, residency status, and KYC verification.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.primaryBtnText}>Log In or Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCG = user.residency === 'Chhattisgarh';
  const kycStatus = user.kycDetails?.status || 'NOT_SUBMITTED';

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Instagram Profile Header Card */}
        <View style={[styles.profileHeaderCard, isDark ? styles.darkCard : styles.lightCard]}>
          <View style={styles.avatarRow}>
            <TouchableOpacity style={styles.avatarTouch} onPress={handlePickAvatar}>
              <View style={styles.avatarRing}>
                {user.avatarUrl ? (
                  <Image source={{ uri: getMediaUrl(user.avatarUrl) }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Camera size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <View style={styles.headerDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.userNameText, isDark ? styles.whiteText : styles.blackText]}>
                  {user.name}
                </Text>
                {kycStatus === 'PASSED' && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text style={styles.verifiedText}>KYC Verified</Text>
                  </View>
                )}
              </View>

              <Text style={styles.usernamePill}>
                @{user.username || user.email?.split('@')[0]}
              </Text>

              <View style={styles.emailRow}>
                <Mail size={12} color="#a1a1aa" />
                <Text style={[styles.emailText, isDark ? styles.mutedDark : styles.mutedLight]}>
                  {user.email}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={16} color="#f43f5e" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsRow, isDark ? styles.darkBorder : styles.lightBorder]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, isDark ? styles.whiteText : styles.blackText]}>
                {stats.totalPosts || 0}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, isDark ? styles.whiteText : styles.blackText]}>
                {user.followers || 0}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, isDark ? styles.whiteText : styles.blackText]}>
                {user.following || 0}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#f43f5e' }]}>
                {stats.totalLikes || 0}
              </Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>
        </View>

        {/* Tab Selection Bar */}
        <View style={[styles.tabsBar, isDark ? styles.darkBorder : styles.lightBorder]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'grid' && styles.activeTabBtn]}
            onPress={() => setActiveTab('grid')}
          >
            <Grid size={16} color={activeTab === 'grid' ? '#0095f6' : '#71717a'} />
            <Text style={[styles.tabBtnText, activeTab === 'grid' && styles.activeTabText]}>
              Grid ({myPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'feed' && styles.activeTabBtn]}
            onPress={() => setActiveTab('feed')}
          >
            <List size={16} color={activeTab === 'feed' ? '#0095f6' : '#71717a'} />
            <Text style={[styles.tabBtnText, activeTab === 'feed' && styles.activeTabText]}>
              Reels
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'kyc' && styles.activeTabBtn]}
            onPress={() => setActiveTab('kyc')}
          >
            <FileCheck size={16} color={activeTab === 'kyc' ? '#10b981' : '#71717a'} />
            <Text style={[styles.tabBtnText, activeTab === 'kyc' && { color: '#10b981' }]}>
              KYC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'settings' && styles.activeTabBtn]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings size={16} color={activeTab === 'settings' ? '#0095f6' : '#71717a'} />
            <Text style={[styles.tabBtnText, activeTab === 'settings' && styles.activeTabText]}>
              Residency
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: INSTAGRAM 3-COLUMN THUMBNAIL GRID */}
        {activeTab === 'grid' && (
          <View style={styles.tabContent}>
            {loadingPosts ? (
              <ActivityIndicator size="small" color="#0095f6" />
            ) : myPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Sparkles size={32} color="#71717a" />
                <Text style={[styles.emptyText, isDark ? styles.whiteText : styles.blackText]}>
                  No Reels Posted Yet
                </Text>
              </View>
            ) : (
              <View style={styles.gridWrapper}>
                {myPosts.map((post) => {
                  const mediaSource = getMediaUrl(post.mediaUrl);
                  const coverSource = post.thumbnailUrl ? getMediaUrl(post.thumbnailUrl) : undefined;
                  const isVideo = post.mediaType === 'video' || post.isVideo || post.mediaUrl?.match(/\.(mp4|mov|webm|mkv)$/i);
                  const thumbnailUrl = getMediaThumbnailUrl(post.mediaUrl, post.thumbnailUrl);

                  return (
                    <TouchableOpacity
                      key={post._id || post.id}
                      style={styles.gridThumb}
                      onPress={() => setSelectedPost(post)}
                      activeOpacity={0.8}
                    >
                      {coverSource ? (
                        <Image source={{ uri: coverSource }} style={styles.thumbImage} resizeMode="cover" />
                      ) : isVideo && Platform.OS === 'web' && thumbnailUrl.match(/\.(mp4|mov|webm|mkv)$/i) ? (
                        <video
                          src={mediaSource}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <Image source={{ uri: thumbnailUrl }} style={styles.thumbImage} resizeMode="cover" />
                      )}

                      {isVideo && (
                        <View style={styles.playBadge}>
                          <Play size={10} color="#ffffff" style={{ marginLeft: 1 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: REELS STREAM VIEW */}
        {activeTab === 'feed' && (
          <View style={styles.tabContent}>
            {myPosts.map((post, index) => (
              <PostCard key={post._id} post={post} isActive={index === 0} />
            ))}
          </View>
        )}

        {/* TAB 3: KYC VERIFICATION UPLOAD FORM */}
        {activeTab === 'kyc' && (
          <View style={[styles.formCard, isDark ? styles.darkCard : styles.lightCard]}>
            {/* Status Banner */}
            <View
              style={[
                styles.statusBanner,
                kycStatus === 'PASSED' && styles.bannerSuccess,
                kycStatus === 'FAILED' && styles.bannerFailed,
                kycStatus === 'PENDING' && styles.bannerPending,
              ]}
            >
              {kycStatus === 'PASSED' ? (
                <CheckCircle2 size={20} color="#10b981" />
              ) : kycStatus === 'FAILED' ? (
                <XCircle size={20} color="#f43f5e" />
              ) : kycStatus === 'PENDING' ? (
                <Clock size={20} color="#fbbf24" />
              ) : (
                <FileCheck size={20} color="#0095f6" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  Status:{' '}
                  {kycStatus === 'PASSED'
                    ? 'Verified & Approved ✅'
                    : kycStatus === 'FAILED'
                    ? 'Rejected ❌'
                    : kycStatus === 'PENDING'
                    ? 'Under Verification ⏳'
                    : 'Not Submitted'}
                </Text>
                <Text style={styles.bannerSub}>
                  Upload Aadhaar card details for prize eligibility verification.
                </Text>
              </View>
            </View>

            {/* Input 1: Aadhaar Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                Aadhaar Card Number (12 Digits)
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                placeholder="1234 5678 9012"
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                keyboardType="numeric"
                maxLength={14}
                value={aadharNumber}
                onChangeText={setAadharNumber}
              />
            </View>

            {/* Input 2: Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                Aadhaar Attached Mobile (10 Digits)
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                placeholder="9876543210"
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                keyboardType="phone-pad"
                maxLength={10}
                value={aadharMobile}
                onChangeText={setAadharMobile}
              />
            </View>

            {/* Input 3: DOB */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                Date of Birth (YYYY-MM-DD)
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                placeholder="1997-08-15"
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                value={dob}
                onChangeText={setDob}
              />
            </View>

            {/* Input 4: Document Image Picker */}
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickAadhaarImage}>
              <Upload size={24} color="#10b981" />
              <Text style={[styles.uploadBoxText, isDark ? styles.whiteText : styles.blackText]}>
                {aadharImageAsset
                  ? 'Aadhaar Photo Attached'
                  : kycData.aadharImage
                  ? 'Change Uploaded Aadhaar Photo'
                  : 'Tap to upload Aadhaar Photo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitKycBtn}
              onPress={handleKycSubmit}
              disabled={submittingKyc}
            >
              {submittingKyc ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitKycText}>Submit KYC Verification</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 4: RESIDENCY SETTINGS */}
        {activeTab === 'settings' && (
          <View style={[styles.formCard, isDark ? styles.darkCard : styles.lightCard]}>
            <View
              style={[
                styles.residencyBanner,
                isCG ? styles.cgEligibleBanner : styles.otherResidencyBanner,
              ]}
            >
              {isCG ? <ShieldCheck size={20} color="#10b981" /> : <AlertCircle size={20} color="#f59e0b" />}
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  {isCG ? 'Eligible for Creator Contest Prizes!' : 'Ineligible for Contest Prizes'}
                </Text>
                <Text style={styles.bannerSub}>
                  {isCG
                    ? 'Residency set to Chhattisgarh. Posts enter the 33 Prize Cascade ranking!'
                    : 'Only Chhattisgarh residents qualify for weekly contest prize tier payouts.'}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                Select State Residency
              </Text>
              {['Chhattisgarh', 'Delhi', 'Maharashtra', 'Karnataka', 'Other State'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.radioOption,
                    residency === st && styles.radioOptionSelected,
                  ]}
                  onPress={() => setResidency(st)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      residency === st ? styles.whiteText : isDark ? styles.mutedDark : styles.blackText,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleResidencySubmit}
              disabled={savingResidency}
            >
              {savingResidency ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Residency</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Reel Preview Modal */}
      {selectedPost && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setSelectedPost(null)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedPost(null)}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.modalCard}>
              <PostCard post={selectedPost} />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

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
  scrollContainer: {
    padding: 16,
    gap: 16,
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  darkCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lightCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0095f6',
    padding: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095f6',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  headerDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  usernamePill: {
    fontSize: 11,
    color: '#0095f6',
    fontWeight: 'bold',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emailText: {
    fontSize: 11,
  },
  logoutBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  darkBorder: {
    borderTopColor: '#27272a',
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderTopColor: '#e4e4e7',
    borderBottomColor: '#e4e4e7',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#a1a1aa',
    textTransform: 'uppercase',
  },
  tabsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#0095f6',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#71717a',
  },
  activeTabText: {
    color: '#0095f6',
  },
  tabContent: {
    minHeight: 200,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridThumb: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181b',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 3,
    borderRadius: 6,
  },
  formCard: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  bannerFailed: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  bannerPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bannerSub: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
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
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  uploadBoxText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitKycBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitKycText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  residencyBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  cgEligibleBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  otherResidencyBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(113, 113, 122, 0.1)',
    marginBottom: 4,
  },
  radioOptionSelected: {
    backgroundColor: '#0095f6',
  },
  radioText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPromptSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#0095f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 50,
    padding: 8,
  },
  modalCard: {
    width: '100%',
    alignItems: 'center',
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
