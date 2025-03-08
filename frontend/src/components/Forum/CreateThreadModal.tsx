'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Thread, CreateThreadData } from '@/types/forum';
import { ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUtils';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateThread: (data: CreateThreadData | FormData) => Promise<void>;
  initialData?: Thread;
  isEditing?: boolean;
}

const sanitizeInput = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

const validateContent = {
  title: (title: string): string | null => {
    if (title.trim().length < 3) return 'Title must be at least 3 characters';
    if (title.length > 255) return 'Title is too long';
    if (/^\s*$/.test(title)) return 'Title cannot be empty';
    return null;
  },
  content: (content: string): string | null => {
    if (content.trim().length < 10) return 'Content must be at least 10 characters';
    if (content.length > 10000) return 'Content is too long';
    if (/^\s*$/.test(content)) return 'Content cannot be empty';
    return null;
  },
  tags: (tags: string[]): string | null => {
    if (tags.some(tag => tag.length > 20)) return 'Tags must be less than 20 characters';
    if (tags.length > 5) return 'Maximum 5 tags allowed';
    if (tags.some(tag => !/^[a-z0-9-]+$/.test(tag))) return 'Tags can only contain letters, numbers, and hyphens';
    return null;
  }
};

const CreateThreadModal: React.FC<CreateThreadModalProps> = ({
  isOpen,
  onClose,
  onCreateThread,
  initialData,
  isEditing = false
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setTags(initialData.tags.map(tag => tag.name).join(', '));
      
      // Get image URL from either image_url or image_key or image_path
      const imageUrl = initialData.image_url || 
                       (initialData.image_key ? getImageUrl(initialData.image_key) : 
                       (initialData.image_key ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${initialData.image_key}` : null));
                       
      if (imageUrl) {
        setImagePreview(imageUrl);
      }
    }
  }, [isEditing, initialData]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setTags('');
      setError(null);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith('/') && !imagePreview.startsWith('http')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  const validateImage = async (file: File): Promise<string | null> => {
    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return 'Please select a valid image file (JPG, JPEG, or PNG)';
    }
    
    // Check file size
    if (file.size > 3.5 * 1024 * 1024) {
      return 'Image size must be less than 3.5MB';
    }
  
    // Check image dimensions
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 50 || img.height < 50) {
          resolve('Image dimensions must be at least 50x50 pixels');
        }
        if (img.width > 4000 || img.height > 4000) {
          resolve('Image dimensions must not exceed 4000x4000 pixels');
        }
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    });
  };
  
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageError = await validateImage(file);
      if (imageError) {
        setError(imageError);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
  
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    try {
      // Validate and sanitize text inputs
      const sanitizedTitle = sanitizeInput(title);
      const sanitizedContent = sanitizeInput(content);
      
      // Validate content
      const titleError = validateContent.title(sanitizedTitle);
      if (titleError) {
        setError(titleError);
        setIsSubmitting(false);
        return;
      }
  
      const contentError = validateContent.content(sanitizedContent);
      if (contentError) {
        setError(contentError);
        setIsSubmitting(false);
        return;
      }
  
      // Process and validate tags
      const tagArray = tags
        .split(',')
        .map(tag => sanitizeInput(tag.trim()).toLowerCase())
        .filter(tag => tag.length > 0);

      const tagsError = validateContent.tags(tagArray);
      if (tagsError) {
        setError(tagsError);
        setIsSubmitting(false);
        return;
      }
  
      // Validate image if present
      if (imageFile) {
        const imageError = await validateImage(imageFile);
        if (imageError) {
          setError(imageError);
          setIsSubmitting(false);
          return;
        }
      }
  
      const formData = new FormData();
      formData.append('title', sanitizedTitle);
      formData.append('content', sanitizedContent);
      formData.append('tags', JSON.stringify(tagArray));
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview === null) {
        formData.append('removeImage', 'true');
      }
  
      await onCreateThread(formData);
      handleClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Failed to update thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && !imagePreview.startsWith('/') && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (imagePreview && !imagePreview.startsWith('/') && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview);
    }
    setTitle('');
    setContent('');
    setTags('');
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto">
        <div className="min-h-screen w-full p-4 flex justify-center">
            <div className="bg-white rounded-lg w-full max-w-2xl my-8 relative">
            <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            {isEditing ? 'Edit Thread' : 'Create New Thread'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter thread title"
                required
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter thread content"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-48 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Image (Optional)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  <ImagePlus size={20} />
                  {imagePreview ? 'Change Image' : 'Add Image'}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2 relative h-40 sm:h-48">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    className="rounded-md object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., review, recommendation, question"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CreateThreadModal;