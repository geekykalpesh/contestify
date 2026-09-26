import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Eye, EyeOff, CheckCircle2, XCircle, ChevronLeft, HelpCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/api';
import { router } from 'expo-router';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function AuthScreen() {
  const { login, signup, user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [isSignupMode, setIsSignupMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [residency, setResidency] = useState('Chhattisgarh');

  // DOB
  const [birthMonth, setBirthMonth] = useState('August');
  const [birthDay, setBirthDay] = useState('15');
  const [birthYear, setBirthYear] = useState('1997');

  // Avatar
  const [avatarAsset, setAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Availability Checks
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user]);

  // Username Live Availability Check
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!isSignupMode || cleanUsername.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.get(`/auth/check-availability?username=${encodeURIComponent(cleanUsername)}`);
        if (res.data?.success) {
          setUsernameAvailable(res.data.data.usernameAvailable);
        }
      } catch (err) {
        console.error('Username check error', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, isSignupMode]);

  // Email Live Availability Check
  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isSignupMode || !cleanEmail || !cleanEmail.includes('@')) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.get(`/auth/check-availability?email=${encodeURIComponent(cleanEmail)}`);
        if (res.data?.success) {
          setEmailAvailable(res.data.data.emailAvailable);
        }
      } catch (err) {
        console.error('Email check error', err);
      } finally {
        setCheckingEmail(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, isSignupMode]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Permission required to access camera roll', 'Permission Denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarAsset(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (isSignupMode) {
      if (usernameAvailable === false) {
        toast.error('Username is already taken. Please choose another.', 'Username Unavailable');
        return;
      }
      if (emailAvailable === false) {
        toast.error('Email is already registered. Please log in.', 'Email Registered');
        return;
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const formattedDob = `${birthYear}-${String(MONTHS.indexOf(birthMonth) + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      try {
        setLoading(true);
        if (avatarAsset) {
          const formData = new FormData();
          formData.append('name', name || cleanUsername);
          formData.append('username', cleanUsername);
          formData.append('email', email.trim());
          formData.append('password', password);
          formData.append('residency', residency);
          formData.append('dob', formattedDob);

          const filename = avatarAsset.uri.split('/').pop() || 'avatar.jpg';
          formData.append('avatar', {
            uri: avatarAsset.uri,
            name: filename,
            type: 'image/jpeg',
          } as any);

          await signup(formData);
        } else {
          await signup({
            name: name || cleanUsername,
            username: cleanUsername,
            email: email.trim(),
            password,
            residency,
            dob: formattedDob,
          });
        }

        toast.success('🎉 Account created! Please log in.', 'Signup Complete');
        setIsSignupMode(false);
        setLoginIdentifier(email);
        setPassword('');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Signup failed', 'Error');
      } finally {
        setLoading(false);
      }
    } else {
      if (!loginIdentifier.trim() || !password) {
        toast.warning('Please enter your login details', 'Input Required');
        return;
      }

      try {
        setLoading(true);
        await login(loginIdentifier.trim(), password);
        toast.success('Welcome back to Contestify!', 'Login Successful');
        router.replace('/');
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Invalid username/email or password';
        toast.error(message, err.response ? 'Login Failed' : 'Network Error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Navigation Bar */}
        {!!user && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        )}

        {/* Card */}
        <View style={[styles.authCard, isDark ? styles.darkCard : styles.lightCard]}>
          {/* Header */}
          <View style={styles.headerBox}>
            <View style={styles.brandRow}>
              <View style={styles.logoRing}>
                <Camera size={18} color="#0095f6" />
              </View>
              <Text style={[styles.brandText, isDark ? styles.whiteText : styles.blackText]}>
                Contestify
              </Text>
            </View>

            <Text style={[styles.title, isDark ? styles.whiteText : styles.blackText]}>
              {isSignupMode ? 'Get started on Contestify' : 'Welcome back'}
            </Text>
            <Text style={[styles.sub, isDark ? styles.mutedDark : styles.mutedLight]}>
              {isSignupMode
                ? 'Sign up to post & watch reels from top creators.'
                : 'Log in with mobile number, username or email.'}
            </Text>
          </View>

          {/* Form */}
          {isSignupMode ? (
            <View style={styles.form}>
              {/* Field 1: Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  Mobile number or email
                </Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                    placeholder="Mobile number or email"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={styles.rightIcon}>
                    {checkingEmail ? (
                      <ActivityIndicator size="small" color="#0095f6" />
                    ) : emailAvailable === true ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : emailAvailable === false ? (
                      <XCircle size={16} color="#f43f5e" />
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Field 2: Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  Password
                </Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                    placeholder="Password"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.rightIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} color="#a1a1aa" /> : <Eye size={16} color="#a1a1aa" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 3: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  Full Name
                </Text>
                <TextInput
                  style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                  placeholder="Full name"
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Field 4: Username */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  Username
                </Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                    placeholder="Username"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    value={username}
                    onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoCapitalize="none"
                  />
                  <View style={styles.rightIcon}>
                    {checkingUsername ? (
                      <ActivityIndicator size="small" color="#0095f6" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : usernameAvailable === false ? (
                      <XCircle size={16} color="#f43f5e" />
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Field 5: Residency */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  State Residency
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.residencyScroll}>
                  {['Chhattisgarh', 'Delhi', 'Maharashtra', 'Karnataka', 'Other State'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.residencyChip,
                        residency === st && styles.residencyChipSelected,
                      ]}
                      onPress={() => setResidency(st)}
                    >
                      <Text
                        style={[
                          styles.residencyChipText,
                          residency === st ? styles.whiteText : isDark ? styles.mutedDark : styles.blackText,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Field 6: Profile Photo Picker */}
              <TouchableOpacity style={styles.avatarPickerBox} onPress={handlePickAvatar}>
                {avatarAsset ? (
                  <Image source={{ uri: avatarAsset.uri }} style={styles.avatarPickerImg} />
                ) : (
                  <Camera size={20} color="#0095f6" />
                )}
                <Text style={[styles.avatarPickerText, isDark ? styles.whiteText : styles.blackText]}>
                  {avatarAsset ? 'Photo Selected' : 'Choose Profile Photo (Optional)'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  Username, email or mobile
                </Text>
                <TextInput
                  style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                  placeholder="Username, email or mobile"
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                  value={loginIdentifier}
                  onChangeText={setLoginIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark ? styles.whiteText : styles.blackText]}>
                  Password
                </Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[styles.input, isDark ? styles.darkInput : styles.lightInput, isDark ? styles.whiteText : styles.blackText]}
                    placeholder="Password"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.rightIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} color="#a1a1aa" /> : <Eye size={16} color="#a1a1aa" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.actionBox}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isSignupMode ? 'Submit & Create Account' : 'Log In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setIsSignupMode(!isSignupMode)}
            >
              <Text style={[styles.secondaryBtnText, isDark ? styles.whiteText : styles.blackText]}>
                {isSignupMode ? 'I already have an account' : 'Create new account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  backBtn: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  authCard: {
    borderRadius: 24,
    padding: 20,
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
  headerBox: {
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoRing: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 149, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sub: {
    fontSize: 12,
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
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
  rightIcon: {
    position: 'absolute',
    right: 12,
  },
  residencyScroll: {
    gap: 6,
  },
  residencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
  },
  residencyChipSelected: {
    backgroundColor: '#0095f6',
  },
  residencyChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  avatarPickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0095f6',
    borderStyle: 'dashed',
  },
  avatarPickerImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPickerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBox: {
    gap: 8,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#0095f6',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 12,
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
