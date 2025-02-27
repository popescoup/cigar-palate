// components/cigars/AddCigar/Description.tsx

'use client';

import React from 'react';
import { SectionProps } from './types';

const validateDescription = (text: string): string | null => {
  // Check for minimum length
  if (text.trim().length < 10) {
    return 'Description must be at least 10 characters long';
  }
  
  // Check for maximum length
  if (text.length > 2000) {
    return 'Description cannot exceed 2000 characters';
  }
  
  // Check for minimum word count
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 5) {
    return 'Description must contain at least 5 words';
  }
  
  // Check for repeated characters (spam prevention)
  if (/(.)\1{10,}/.test(text)) {
    return 'Description contains too many repeated characters';
  }
  
  return null;
};

const Description: React.FC<SectionProps> = ({
  formData,
  onChange,
  errors,
  setErrors
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    const validationError = validateDescription(e.target.value);
    if (validationError && setErrors) {
      setErrors(prev => ({ ...prev, description: validationError }));
    } else if (setErrors) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Description</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detailed Description *
        </label>
        <textarea
      name="description"
      placeholder="Enter a detailed description of the cigar"
      value={formData.description}
      onChange={handleChange}
      rows={4}
      maxLength={2000}
      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black resize-y
        ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
    />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {2000 - (formData.description?.length || 0)} characters remaining
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Include any additional details about the cigar that would be helpful for others to know.
        </p>
      </div>
    </div>
  );
};

export default Description;