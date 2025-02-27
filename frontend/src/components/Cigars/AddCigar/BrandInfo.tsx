// components/cigars/AddCigar/BrandInfo.tsx

'use client';

import React from 'react';
import { SectionProps, Brand } from './types';
import { validateFile, MAX_FILE_SIZE } from '@/utils/fileValidation';

interface BrandInfoProps extends SectionProps {
  brands: Brand[];
  isNewBrand: boolean;
  setIsNewBrand: (value: boolean) => void;
  brandFile: File | null;
  onBrandFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const sanitizeInput = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

const validateBrandName = (name: string): string | null => {
  const sanitizedName = sanitizeInput(name);
  
  if (sanitizedName.trim().length < 2) {
    return 'Brand name must be at least 2 characters long';
  }
  
  if (sanitizedName.length > 50) {
    return 'Brand name cannot exceed 50 characters';
  }
  
  if (!/^[a-zA-Z0-9\s'",.&()-]+$/.test(sanitizedName)) {
    return 'Brand name contains invalid characters';
  }
  
  if (/(.)\1{4,}/.test(sanitizedName)) {
    return 'Brand name contains too many repeated characters';
  }
  
  return null;
};

const validateBrandDescription = (description: string): string | null => {
  const sanitizedDesc = sanitizeInput(description);
  
  if (sanitizedDesc.trim().length < 10) {
    return 'Brand description must be at least 10 characters long';
  }
  
  if (sanitizedDesc.length > 1000) {
    return 'Brand description cannot exceed 1000 characters';
  }
  
  // Check for minimum word count
  const wordCount = sanitizedDesc.trim().split(/\s+/).length;
  if (wordCount < 5) {
    return 'Brand description must contain at least 5 words';
  }
  
  if (/(.)\1{10,}/.test(sanitizedDesc)) {
    return 'Brand description contains too many repeated characters';
  }
  
  return null;
};

const BrandInfo: React.FC<BrandInfoProps> = ({
  formData,
  onChange,
  errors,
  setErrors,
  brands,
  isNewBrand,
  setIsNewBrand,
  brandFile,
  onBrandFileChange
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
    onChange(e);
    
    if (e.target.name === 'new_brand') {
        const validationError = validateBrandName(e.target.value);
        if (validationError && setErrors) {
            setErrors(prev => ({ ...prev, new_brand: validationError }));
        } else if (setErrors) {
            setErrors(prev => ({ ...prev, new_brand: '' }));
        }
    }
    
    if (e.target.name === 'new_brand_description') {
        const validationError = validateBrandDescription(e.target.value);
        if (validationError && setErrors) {
            setErrors(prev => ({ ...prev, new_brand_description: validationError }));
        } else if (setErrors) {
            setErrors(prev => ({ ...prev, new_brand_description: '' }));
        }
    }
};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      const validationError = validateFile(file);

      if (validationError) {
        // Create a synthetic event to clear the file input
        const clearEvent = {
          ...e,
          target: {
            ...e.target,
            value: ''
          }
        };
        onBrandFileChange(clearEvent);
        return;
      }
    }
    
    onBrandFileChange(e);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Brand Information</h3>
      
      <div className="space-y-4">
        {/* Radio Buttons */}
        <div className="flex space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer text-gray-900">
            <input
              type="radio"
              name="brand_option"
              checked={!isNewBrand}
              onChange={() => setIsNewBrand(false)}
              className="w-4 h-4 text-blue-600"
            />
            <span>Select Existing Brand</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-gray-900">
            <input
              type="radio"
              name="brand_option"
              checked={isNewBrand}
              onChange={() => setIsNewBrand(true)}
              className="w-4 h-4 text-blue-600"
            />
            <span>Add New Brand</span>
          </label>
        </div>

        {!isNewBrand ? (
          // Existing Brand Selection
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Brand *
            </label>
            <select
              name="brand_id"
              value={formData.brand_id}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                ${errors.brand_id ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a brand</option>
              {Array.isArray(brands) && brands.length > 0 ? (
                brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {sanitizeInput(brand.name)}
                  </option>
                ))
              ) : (
                <option value="" disabled>No brands available</option>
              )}
            </select>
            {errors.brand_id && (
              <p className="mt-1 text-sm text-red-600">{errors.brand_id}</p>
            )}
          </div>
        ) : (
          // New Brand Form
          <div className="space-y-4">
            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Brand Name *
              </label>
              <input
                type="text"
                name="new_brand"
                placeholder="Enter new brand name"
                value={formData.new_brand}
                onChange={handleInputChange}
                maxLength={50}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                  ${errors.new_brand ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.new_brand && (
                <p className="mt-1 text-sm text-red-600">{errors.new_brand}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {50 - (formData.new_brand?.length || 0)} characters remaining
              </p>
            </div>

            {/* Brand Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Logo/Image *
              </label>
              <div className={`border-2 border-dashed rounded-md p-4
                ${errors.brand_image ? 'border-red-500' : 'border-gray-300'}
                ${brandFile ? 'bg-green-50' : 'bg-gray-50'}`}>
                <input
                  type="file"
                  name="brand_image"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Maximum file size: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB. Supported formats: JPEG, PNG
                </p>
              </div>
              {brandFile && (
                <p className="mt-1 text-sm text-green-600">
                  Selected image: {sanitizeInput(brandFile.name)} ({(brandFile.size / (1024 * 1024)).toFixed(2)}MB)
                </p>
              )}
              {errors.brand_image && (
                <p className="mt-1 text-sm text-red-600">{errors.brand_image}</p>
              )}
            </div>

            {/* Brand Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Description *
              </label>
              <textarea
                name="new_brand_description"
                placeholder="Enter a description of the brand"
                value={formData.new_brand_description || ''}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black resize-y
                  ${errors.new_brand_description ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.new_brand_description && (
                <p className="mt-1 text-sm text-red-600">{errors.new_brand_description}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                {1000 - (formData.new_brand_description?.length || 0)} characters remaining
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Provide information about the brand's history, values, and cigar-making traditions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandInfo;