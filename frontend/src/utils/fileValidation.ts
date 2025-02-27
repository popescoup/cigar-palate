// utils/fileValidation.ts

export const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB in bytes

export const validateFile = (file: File): string | null => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'File must be an image (JPEG or PNG)';
  }
  
  // Check specific image types
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return 'Only JPEG and PNG images are allowed';
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB`;
  }
  
  return null;
};