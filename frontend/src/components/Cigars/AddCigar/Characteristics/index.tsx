import React from 'react';
import type { FormData, SectionProps } from '../types';

interface CharacteristicsProps extends SectionProps {
    setFormData: (value: React.SetStateAction<FormData>) => void;
}

const sanitizeInput = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

const validateTextField = (text: string, fieldName: string, maxLength: number = 100): string | null => {
  if (text.trim() && !/^[a-zA-Z0-9\s'",.&()-]+$/.test(text)) {
    return `${fieldName} contains invalid characters`;
  }
  
  if (text.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  
  if (/(.)\1{4,}/.test(text)) {
    return `${fieldName} contains too many repeated characters`;
  }
  
  return null;
};

const validateAging = (value: string): string | null => {
  if (!value) return null;
  
  const number = Number(value);
  if (isNaN(number)) {
    return 'Aging must be a valid number';
  }
  
  if (number < 0) {
    return 'Aging cannot be negative';
  }
  
  if (number > 100) {
    return 'Aging value seems unrealistic';
  }
  
  return null;
};

const validateDimensions = (value: string): string | null => {
  if (!value) return null;
  
  // Basic pattern for dimensions like "6 1/8" by 50 ring gauge"
  const dimensionsPattern = /^[\d\s\/"]+ by \d+ (ring gauge|rg)?$/i;
  if (!dimensionsPattern.test(value)) {
    return 'Invalid dimensions format. Example: 6 1/8" by 50 ring gauge';
  }
  
  return null;
};

const Characteristics: React.FC<CharacteristicsProps> = ({
    formData,
    onChange,
    errors,
    setErrors,
    setFormData
}) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange(e);

        if (setErrors) {
            let validationError: string | null = null;

            switch (name) {
                case 'aging':
                    validationError = validateAging(value);
                    break;
                case 'dimensions':
                    validationError = validateDimensions(value);
                    break;
                case 'country_of_origin':
                case 'wrap_type':
                case 'strength':
                case 'filler':
                case 'shape':
                case 'binder':
                case 'size':
                case 'color':
                case 'made_by':
                    validationError = validateTextField(value, name.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
                    break;
            }

            if (validationError) {
                setErrors(prev => ({ ...prev, [name]: validationError }));
            } else {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Characteristics</h3>
                <span className="text-sm text-gray-500 italic">All fields optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price Range
                    </label>
                    <select
                        name="price_range"
                        value={formData.price_range || ''}
                        onChange={onChange}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.price_range ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Select price range</option>
                        <option value="<$10">&lt;$10</option>
                        <option value="$10.01 - $25">$10.01 - $25</option>
                        <option value="$25.01 - $50">$25.01 - $50</option>
                        <option value="$50.01 - $75">$50.01 - $75</option>
                        <option value="$75.01 - $100">$75.01 - $100</option>
                        <option value="$100.01<">$100.01&lt;</option>
                    </select>
                    {errors.price_range && (
                        <p className="mt-1 text-sm text-red-600">{errors.price_range}</p>
                    )}
                </div>

                {/* Wrapper */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wrapper
                    </label>
                    <input
                        type="text"
                        name="wrap_type"
                        value={formData.wrap_type || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Connecticut, Habano"
                        maxLength={100}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.wrap_type ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.wrap_type && (
                        <p className="mt-1 text-sm text-red-600">{errors.wrap_type}</p>
                    )}
                </div>

                {/* Strength */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strength
                    </label>
                    <input
                        type="text"
                        name="strength"
                        value={formData.strength || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Full, Medium-Full"
                        maxLength={50}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.strength ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.strength && (
                        <p className="mt-1 text-sm text-red-600">{errors.strength}</p>
                    )}
                </div>

                {/* Filler */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filler
                    </label>
                    <input
                        type="text"
                        name="filler"
                        value={formData.filler || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Long Filler, Short Filler"
                        maxLength={100}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.filler ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.filler && (
                        <p className="mt-1 text-sm text-red-600">{errors.filler}</p>
                    )}
                </div>

                {/* Shape */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shape
                    </label>
                    <input
                        type="text"
                        name="shape"
                        value={formData.shape || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Parejos, Figurados"
                        maxLength={50}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.shape ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.shape && (
                        <p className="mt-1 text-sm text-red-600">{errors.shape}</p>
                    )}
                </div>

                {/* Binder */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Binder
                    </label>
                    <input
                        type="text"
                        name="binder"
                        value={formData.binder || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Cuba, Nicaragua"
                        maxLength={100}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.binder ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.binder && (
                        <p className="mt-1 text-sm text-red-600">{errors.binder}</p>
                    )}
                </div>

                {/* Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                    </label>
                    <input
                        type="text"
                        name="size"
                        value={formData.size || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Corona, Robusto, Churchill"
                        maxLength={50}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.size ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.size && (
                        <p className="mt-1 text-sm text-red-600">{errors.size}</p>
                    )}
                </div>

                {/* Aging */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aging (Years)
                    </label>
                    <input
                        type="number"
                        name="aging"
                        placeholder="Enter aging in years"
                        value={formData.aging || ''}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.aging ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.aging && (
                        <p className="mt-1 text-sm text-red-600">{errors.aging}</p>
                    )}
                </div>

                {/* Dimensions */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dimensions
                    </label>
                    <input
                        type="text"
                        name="dimensions"
                        value={formData.dimensions || ''}
                        onChange={handleInputChange}
                        placeholder='e.g., 6 1/8" by 50 ring gauge'
                        maxLength={50}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.dimensions ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.dimensions && (
                        <p className="mt-1 text-sm text-red-600">{errors.dimensions}</p>
                    )}
                </div>

                {/* Country of Origin */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country of Origin
                    </label>
                    <input
                        type="text"
                        name="country_of_origin"
                        placeholder="Enter country of origin"
                        value={formData.country_of_origin || ''}
                        onChange={handleInputChange}
                        maxLength={100}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.country_of_origin ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.country_of_origin && (
                        <p className="mt-1 text-sm text-red-600">{errors.country_of_origin}</p>
                    )}
                </div>

                {/* Color */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                    </label>
                    <input
                        type="text"
                        name="color"
                        value={formData.color || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Maduro, Colorado, Claro"
                        maxLength={50}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.color ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.color && (
                        <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                    )}
                </div>

                {/* Made By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Made By
                    </label>
                    <input
                        type="text"
                        name="made_by"
                        value={formData.made_by || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Habanos S.A."
                        maxLength={100}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black
                            ${errors.made_by ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.made_by && (
                        <p className="mt-1 text-sm text-red-600">{errors.made_by}</p>
                    )}
                </div>
            </div>

            {/* Manufacturing Method - Full Width */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturing Method
                </label>
                <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer text-gray-900">
                        <input
                            type="radio"
                            name="handmade"
                            checked={formData.handmade === true}
                            onChange={() => setFormData((prev: FormData) => ({ ...prev, handmade: true }))}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span>Handmade</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer text-gray-900">
                        <input
                            type="radio"
                            name="handmade"
                            checked={formData.handmade === false}
                            onChange={() => setFormData((prev: FormData) => ({ ...prev, handmade: false }))}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span>Machine-made</span>
                    </label>
                </div>
                {errors.handmade && (
                    <p className="mt-1 text-sm text-red-600">{errors.handmade}</p>
                )}
            </div>
        </div>
    );
};

export default Characteristics;