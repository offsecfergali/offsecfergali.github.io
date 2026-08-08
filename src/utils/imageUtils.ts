/**
 * Resolves an image URL or data string into a clean, direct displayable image URL.
 * Handles base64 data URLs, blob URLs, Google Drive links, Dropbox, GitHub, Imgur, etc.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return '';
  let src = url.trim();

  // If already data or blob URL, return immediately as-is
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // Remove surrounding quotes or angle brackets if user pasted <http...> or "http..."
  src = src.replace(/^["'<>]|["'<>]$/g, '');

  // Add https:// if starts with www. or domain without protocol
  if (
    !src.startsWith('http://') &&
    !src.startsWith('https://') &&
    !src.startsWith('/') &&
    !src.startsWith('./')
  ) {
    if (src.includes('.') && !src.includes(' ')) {
      src = `https://${src}`;
    }
  }

  // Google Drive share link conversion -> direct image URL
  const driveMatch = src.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?#&]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Dropbox link conversion
  if (src.includes('dropbox.com')) {
    return src.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
  }

  // GitHub blob link conversion
  if (src.includes('github.com') && src.includes('/blob/')) {
    return src.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  // Imgur page link conversion
  const imgurMatch = src.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)$/);
  if (imgurMatch && imgurMatch[1] && !src.includes('i.imgur.com')) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  return src;
}

/**
 * URL transform for react-markdown to prevent stripping data: base64 image URLs and custom links
 */
export function customUrlTransform(url: string): string {
  if (!url) return '';
  return resolveImageUrl(url);
}

/**
 * Processes an uploaded image on the client side into a compressed Data URL for static web deployment.
 * Stored directly in client memory / localStorage / markdown content without requiring server endpoints.
 */
export async function uploadImageToServer(file: File): Promise<string> {
  return compressAndSaveImage(file, `img_${Date.now()}`, 1000, 800, 0.7);
}

/**
 * Resizes an image file to max dimensions and converts it to a compressed JPEG data URL.
 * Also safely saves to localStorage without throwing QuotaExceededError.
 */
export async function compressAndSaveImage(
  file: File,
  storageKey: string = 'blog_avatar_url',
  maxWidth: number = 900,
  maxHeight: number = 700,
  quality: number = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      // Fallback: create ObjectURL if FileReader fails
      try {
        const objectUrl = URL.createObjectURL(file);
        resolve(objectUrl);
      } catch {
        resolve('');
      }
    };

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data URL if canvas image loading fails
        resolve(rawDataUrl);
      };

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);

          // Safe localStorage set
          try {
            localStorage.setItem(storageKey, compressedDataUrl);
          } catch (err) {
            console.warn(`QuotaExceededError when saving ${storageKey} to localStorage:`, err);
          }

          resolve(compressedDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

export function safeGetStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return null;
  }
}
