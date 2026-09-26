import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Environment Variables loaded dynamically from .env (ignored by Git)
export const USER_SERVICE_URL = process.env.EXPO_PUBLIC_API_URL || '';
export const ADMIN_SERVICE_URL = process.env.EXPO_PUBLIC_ADMIN_API_URL || '';

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
