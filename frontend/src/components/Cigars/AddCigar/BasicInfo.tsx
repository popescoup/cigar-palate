// components/cigars/AddCigar/BasicInfo.tsx

'use client';

import React from 'react';
import { SectionProps } from './types';
import { validateFile, MAX_FILE_SIZE } from '@/utils/fileValidation';

interface BasicInfoProps extends SectionProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const sanitizeInput = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

const validateCigarName = (name: string): string | null => {
  const sanitizedName = sanitizeInput(name);
  
  // Check for minimum length (actual content, not just whitespace)
  if (sanitizedName.trim().length < 2) {
    return 'Cigar name must be at least 2 characters long';
  }

  // Check for maximum length
  if (sanitizedName.length > 100) {
    return 'Cigar name cannot exceed 100 characters';
  }

  // Check for invalid characters
  if (!/^[a-zA-Z0-9\s'",.&()-]+$/.test(sanitizedName)) {
    return 'Cigar name contains invalid characters';
  }

  // Check for repeated characters (potential spam)
  if (/(.)\1{4,}/.test(sanitizedName)) {
    return 'Cigar name contains too many repeated characters';
  }

  return null;
};

const BasicInfo: React.FC<BasicInfoProps> = ({
  formData,
  onChange,
  errors,
  setErrors,
  file,
  onFileChange
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const validationError = validateCigarName(e.target.value);
    if (validationError && setErrors) {
        setErrors(prev => ({ ...prev, name: validationError }));
    } else if (setErrors) {
        setErrors(prev => ({ ...prev, name: '' }));
    }
};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
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
        onFileChange(clearEvent);
        return;
      }
    }
    
    onFileChange(e);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Cigar Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cigar Name *
        </label>
        <input
          type="text"
          name="name"
          placeholder="Enter cigar name"
          value={formData.name}
          onChange={handleInputChange}
          maxLength={100}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black
            ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {100 - (formData.name?.length || 0)} characters remaining
        </p>
      </div>
      
      {/* Updated Image Upload section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cigar Image *
        </label>
        <div className={`border-2 border-dashed rounded-md p-4
          ${errors.image ? 'border-red-500' : 'border-gray-300'}
          ${file ? 'bg-green-50' : 'bg-gray-50'}`}>
          <input
            type="file"
            name="image"
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
        {file && (
          <p className="mt-1 text-sm text-green-600">
            Selected image: {sanitizeInput(file.name)} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}
        {errors.image && (
          <p className="mt-1 text-sm text-red-600">{errors.image}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfo;