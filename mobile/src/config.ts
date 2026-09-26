import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically handle server URL depending on platform, environment variables & network IP
const getLocalHostUrl = (port: number) => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:${port}`;
    }
  }

  if (Platform.OS === 'android') {
    // 10.176.100.150 is the local Wi-Fi IP address for physical Android device testing
    return `http://10.176.100.150:${port}`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:${port}`;
  }
  return `http://localhost:${port}`;
};

export const USER_SERVICE_URL = getLocalHostUrl(5001);
export const ADMIN_SERVICE_URL = getLocalHostUrl(5002);

export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';

  // Handle absolute HTTP/HTTPS URLs (Cloudinary CDN, S3, external links)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    let formattedUrl = url.replace(/^http:\/\//i, 'https://');

    // Cloudinary URL Auto-Repair & Format Optimization
    if (formattedUrl.includes('res.cloudinary.com')) {
      if (
        formattedUrl.includes('/image/upload/') &&
        (formattedUrl.match(/\.(mp4|mov|webm|mkv|avi)$/i) || formattedUrl.includes('/creator-contest-reels/'))
      ) {
        formattedUrl = formattedUrl.replace('/image/upload/', '/video/upload/');
      }

      if (
        formattedUrl.includes('/video/upload/') &&
        !formattedUrl.match(/\.(mp4|mov|webm|mkv|avi|m3u8)$/i)
      ) {
        formattedUrl = `${formattedUrl}.mp4`;
      }
    }

    return formattedUrl;
  }

  // Handle local relative upload paths (/uploads/filename.mp4)
  return `${USER_SERVICE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getMediaThumbnailUrl = (url?: string | null, thumbnailUrl?: string | null): string => {
  if (thumbnailUrl) return getMediaUrl(thumbnailUrl);
  if (!url) return '';

  let mediaUrl = getMediaUrl(url);

  // If Cloudinary video URL, convert extension to .jpg for <Image> compatibility!
  if (mediaUrl.includes('res.cloudinary.com')) {
    if (mediaUrl.includes('/video/upload/')) {
      return mediaUrl.replace(/\.(mp4|mov|webm|mkv|avi)$/i, '.jpg');
    }
    if (mediaUrl.includes('/image/upload/')) {
      return mediaUrl.replace('/image/upload/', '/video/upload/').replace(/\.(mp4|mov|webm|mkv|avi)$/i, '.jpg');
    }
  }

  return mediaUrl;
};
