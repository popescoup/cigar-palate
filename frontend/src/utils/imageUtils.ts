// src/utils/imageUtils.ts

// Constants for Spaces configuration
const SPACES_ENDPOINT = process.env.NEXT_PUBLIC_SPACES_ENDPOINT || '';
const SPACES_NAME = process.env.NEXT_PUBLIC_SPACES_NAME || '';
const SPACES_CDN_ENDPOINT = process.env.NEXT_PUBLIC_SPACES_CDN_ENDPOINT || '';

/**
 * Returns the proper URL for an image, handling different possible formats
 * during the transition to DO Spaces only.
 * 
 * @param imageKeyOrPath The image key or full path
 * @returns The full URL to display the image
 */
export const getImageUrl = (imageKeyOrPath: string | null | undefined): string | null => {
  if (!imageKeyOrPath) return null;
  
  // Handle legacy format with 'uploads/spaces/' prefix during transition
  if (imageKeyOrPath.includes('uploads/spaces/')) {
    const key = imageKeyOrPath.replace('uploads/uploads/spaces/', '').replace('uploads/spaces/', '');
    
    // Return direct Spaces URL
    return getSpacesUrl(key);
  }
  
  // Handle direct image keys (new format)
  if (imageKeyOrPath.match(/^image-[0-9]+-[0-9]+\.(jpg|jpeg|png)$/i)) {
    return getSpacesUrl(imageKeyOrPath);
  }
  
  // For backward compatibility - local path case (this will eventually be removed)
  if (imageKeyOrPath.startsWith('uploads/')) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${imageKeyOrPath}`;
  }
  
  // Default: treat as a key
  return getSpacesUrl(imageKeyOrPath);
};

/**
 * Get a Spaces URL for a specific key
 * 
 * @param key The image key
 * @returns The full Spaces URL
 */
const getSpacesUrl = (key: string): string => {
  // Use CDN if available
  if (SPACES_CDN_ENDPOINT) {
    const url = `https://${SPACES_CDN_ENDPOINT}/${key}`;
    return url;
  }
  
  // Fall back to direct Spaces URL
  const url = `https://${SPACES_NAME}.${SPACES_ENDPOINT}/${key}`;
  return url;
};

/**
 * Get a sized/optimized version of an image URL.
 * This function can be used to request different sizes from a CDN
 * or image optimization service.
 * 
 * @param key The image key
 * @param width The desired width
 * @param height The desired height (optional)
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  imageKeyOrPath: string | null | undefined,
  width: number,
  height?: number
): string | null => {
  const baseUrl = getImageUrl(imageKeyOrPath);
  if (!baseUrl) return null;
  
  // If using a CDN with image optimization capabilities,
  // you can modify the URL here to include sizing parameters
  
  // For example, with an imaginary CDN:
  // return `${baseUrl}?width=${width}${height ? `&height=${height}` : ''}`;
  
  // For now, just return the base URL
  return baseUrl;
};

/**
 * Get URL for a placeholder image with specified dimensions
 * 
 * @param width Width of placeholder
 * @param height Height of placeholder
 * @returns Placeholder image URL
 */
export const getPlaceholderUrl = (width: number = 400, height: number = 300): string => {
  return `/api/placeholder/${width}/${height}`;
};