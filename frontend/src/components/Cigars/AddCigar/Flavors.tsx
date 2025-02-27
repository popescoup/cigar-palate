// components/cigars/AddCigar/Flavors.tsx

'use client';

import React from 'react';
import { SectionProps } from './types';

const validateFlavors = (text: string): string | null => {
  const flavors = text.split(',').map(f => f.trim()).filter(f => f.length > 0);
  
  // Check if any flavors are provided
  if (flavors.length === 0) {
    return 'At least one flavor is required';
  }
  
  // Check individual flavor lengths
  if (flavors.some(flavor => flavor.length > 30)) {
    return 'Each flavor must be less than 30 characters';
  }
  
  // Check for valid characters
  if (flavors.some(flavor => !/^[a-zA-Z\s-]+$/.test(flavor))) {
    return 'Flavors can only contain letters, spaces, and hyphens';
  }
  
  // Check total number of flavors
  if (flavors.length > 10) {
    return 'Maximum of 10 flavors allowed';
  }
  
  return null;
};

const Flavors: React.FC<SectionProps> = ({
  formData,
  onChange,
  errors,
  setErrors
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const validationError = validateFlavors(e.target.value);
    if (validationError && setErrors) {
      setErrors(prev => ({ ...prev, flavors: validationError }));
    } else if (setErrors) {
      setErrors(prev => ({ ...prev, flavors: '' }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Flavors</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Flavors (comma-separated) *
        </label>
        <input
      type="text"
      name="flavors"
      value={formData.flavors}
      onChange={handleChange}
      placeholder="e.g., woody, earthy, spicy, leather"
      maxLength={300}
      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
        ${errors.flavors ? 'border-red-500' : 'border-gray-300'}`}
    />
        {errors.flavors && (
          <p className="mt-1 text-sm text-red-600">{errors.flavors}</p>
        )}
        <p className="text-sm text-gray-500">
          {300 - (formData.flavors?.length || 0)} characters remaining
        </p>
        <p className="text-sm text-gray-500">
          Enter flavors separated by commas (e.g., woody, earthy, spicy)
        </p>
      </div>
    </div>
  );
};

export default Flavors;