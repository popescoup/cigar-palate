'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import type { FormData, Brand, FormErrors } from './types';
import BasicInfo from './BasicInfo';
import BrandInfo from './BrandInfo';
import Flavors from './Flavors';
import Characteristics from './Characteristics';
import Description from './Description';
import { validateFile } from '@/utils/fileValidation';

const sanitizeInput = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

// API functions
const fetchBrands = async (): Promise<Brand[]> => {
  const { data } = await axios.get('/api/brands/all');
  return data.brands || [];
};

const submitCigar = async ({
  formData,
  file,
  brandFile
}: {
  formData: FormData;
  file: File | null;
  brandFile: File | null;
}): Promise<any> => {
  const data = new FormData();
  
  try {
    // Required fields
    data.append('name', sanitizeInput(formData.name));
    
    // Brand Info
    if (formData.new_brand) {
      data.append('new_brand_name', sanitizeInput(formData.new_brand));
      data.append('brand_id', '');
      data.append('new_brand_description', sanitizeInput(formData.new_brand_description || ''));
      if (brandFile) {
        data.append('brand_image', brandFile);
      }
    } else {
      data.append('brand_id', String(formData.brand_id));
      data.append('new_brand_name', '');
    }
    
    // Flavors - Add this missing part
    const flavorsArray = formData.flavors
      .split(',')
      .map(flavor => sanitizeInput(flavor.trim()))
      .filter(flavor => flavor.length > 0)
      .map(flavor => flavor.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '));
    data.append('flavors', JSON.stringify(flavorsArray));
    
    // Optional characteristics
    if (formData.shape) data.append('shape', sanitizeInput(formData.shape));
    if (formData.size) data.append('size', sanitizeInput(formData.size));
    if (formData.color) data.append('color', sanitizeInput(formData.color));
    if (formData.wrap_type) data.append('wrap_type', sanitizeInput(formData.wrap_type));
    if (formData.filler) data.append('filler', sanitizeInput(formData.filler));
    if (formData.country_of_origin) data.append('country_of_origin', sanitizeInput(formData.country_of_origin));
    if (formData.aging) data.append('aging', formData.aging); // Don't sanitize numeric value
    if (formData.handmade !== undefined) data.append('handmade', formData.handmade.toString());
    if (formData.dimensions) data.append('dimensions', sanitizeInput(formData.dimensions));
    if (formData.made_by) data.append('made_by', sanitizeInput(formData.made_by));
    if (formData.price_range) data.append('price_range', formData.price_range);
    if (formData.strength) data.append('strength', sanitizeInput(formData.strength));
    if (formData.binder) data.append('binder', sanitizeInput(formData.binder));
    
    // Required description
    data.append('description', sanitizeInput(formData.description));

    // Image
    if (file) {
      data.append('image', file);
    }

    // Debug log
    const formDataEntries: { [key: string]: any } = {};
    data.forEach((value, key) => {
      formDataEntries[key] = value;
    });
    console.log('Form data being sent:', formDataEntries);

    const response = await axios.post(
      '/api/pending-submissions',
      data,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Submission error details:', {
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
    }
    throw error;
  }
};

export default function AddCigarForm() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand_id: '',
    new_brand: '',
    new_brand_description: '',
    flavors: '',
    shape: '',
    size: '',
    color: '',
    wrap_type: '',
    filler: '',
    country_of_origin: '',
    aging: '',
    handmade: true,
    description: '',
    price_range: '',
    strength: '',
    binder: '',
    dimensions: '',
    made_by: ''  
});
  const [file, setFile] = useState<File | null>(null);
  const [brandFile, setBrandFile] = useState<File | null>(null);
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch brands query
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  // Submit cigar mutation
  const submitMutation = useMutation({
    mutationFn: submitCigar,
    onSuccess: () => {
      setTimeout(() => {
        router.push('/');
      }, 1800);
    }
  });

  const validateForm = () => {
    let newErrors: FormErrors = {};
    
    // Basic Info validation
    if (!formData.name.trim()) {
      newErrors.name = 'Cigar name is required';
    }

    // Brand Info validation
    if (isNewBrand) {
      if (!formData.new_brand.trim()) {
        newErrors.new_brand = 'New brand name is required';
      }
      if (!formData.new_brand_description?.trim()) {
        newErrors.new_brand_description = 'Brand description is required';
      }
      if (!brandFile) {
        newErrors.brand_image = 'Brand image is required';
      }
    } else {
      if (!formData.brand_id) {
        newErrors.brand_id = 'Please select an existing brand';
      }
    }

    // Image validation
    if (!file) {
      newErrors.image = 'Cigar image is required';
    }

    // Flavors validation
    const flavorsArray = formData.flavors
      .split(',')
      .map(flavor => flavor.trim())
      .filter(flavor => flavor.length > 0);
    
    if (flavorsArray.length === 0) {
      newErrors.flavors = 'At least one flavor is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Optional fields validation - only validate if a value is provided
    if (formData.aging && isNaN(Number(formData.aging))) {
      newErrors.aging = 'Aging must be a valid number';
    }

    if (formData.aging && Number(formData.aging) < 0) {
      newErrors.aging = 'Aging cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setErrors(prev => ({ ...prev, image: error }));
        e.target.value = ''; // Reset input
        return;
      }
      setFile(selectedFile);
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };
  
  const onBrandFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setErrors(prev => ({ ...prev, brand_image: error }));
        e.target.value = ''; // Reset input
        return;
      }
      setBrandFile(selectedFile);
      setErrors(prev => ({ ...prev, brand_image: '' }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await submitMutation.mutateAsync({ formData, file, brandFile });
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  if (userLoading) return <div>Loading...</div>;
  if (!currentUser) return <div>Please log in to submit cigars.</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Submit a New Cigar</h1>

      {/* Information Banner */}
      <div className="mb-8 p-4 rounded-md bg-blue-50 border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Submission Information</h2>
        <p className="text-blue-600">
          Our database consists entirely of user submissions. All submissions will be reviewed by our administrators before being published.
          This process helps maintain the quality and accuracy of our database.
          You will receive a notification after our administrators have reviewed your submission.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
  <BasicInfo
    formData={formData}
    onChange={onChange}
    errors={errors}
    file={file}
    onFileChange={onFileChange}
  />

  <BrandInfo
    formData={formData}
    onChange={onChange}
    errors={errors}
    brands={brands}
    isNewBrand={isNewBrand}
    setIsNewBrand={setIsNewBrand}
    brandFile={brandFile}
    onBrandFileChange={onBrandFileChange}
  />

  <Description
    formData={formData}
    onChange={onChange}
    errors={errors}
  />

  <Flavors
    formData={formData}
    onChange={onChange}
    errors={errors}
  />

  <Characteristics
    formData={formData}
    onChange={onChange}
    errors={errors}
    setFormData={setFormData}
  />

        {/* Status Messages */}
        {submitMutation.isSuccess && (
          <div className="mb-6 p-4 rounded-md bg-green-100 text-green-800 border border-green-300">
            <p className="font-medium">Your cigar has been submitted successfully and is pending approval.</p>
            <p className="mt-1 text-sm">We will review your submission and notify you once it's approved.</p>
          </div>
        )}

        {submitMutation.isError && (
          <div className="mb-6 p-4 rounded-md bg-red-100 text-red-800 border border-red-300">
            <p className="font-medium">Failed to submit cigar.</p>
            <p className="mt-1 text-sm">{(submitMutation.error as any)?.response?.data?.message || 'Please try again.'}</p>
          </div>
        )}

        {/* Submit Button Section */}
        <div className="space-y-4">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors
              ${submitMutation.isPending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </button>

          {/* Additional help text */}
          <p className="text-sm text-gray-500 text-center">
            Your submission will be reviewed by our administrators before being published.
            You will be notified once the review is complete.
          </p>
        </div>
      </form>
    </div>
  );
}