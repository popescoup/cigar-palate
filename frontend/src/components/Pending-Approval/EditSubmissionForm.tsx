import React, { useState } from 'react';
import { PendingSubmission } from '@/types/pending';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { validateFile, MAX_FILE_SIZE } from '@/utils/fileValidation';
import { getImageUrl } from '@/utils/imageUtils';

interface EditSubmissionFormProps {
  submission: PendingSubmission;
  open: boolean;
  onClose: () => void;
  onSubmissionUpdated: (updatedSubmission: PendingSubmission) => void;
}

const EditSubmissionForm = ({ submission, open, onClose, onSubmissionUpdated }: EditSubmissionFormProps) => {
  const [formData, setFormData] = useState({
    cigar_name: submission.cigar_name,
    brand_id: submission.brand_id,
    flavors: submission.flavors,
    shape: submission.shape || '',
    size: submission.size || '',
    color: submission.color || '',
    wrap_type: submission.wrap_type || '',
    filler: submission.filler || '',
    country_of_origin: submission.country_of_origin || '',
    aging: submission.aging || '',
    handmade: submission.handmade,
    description: submission.description,
    new_brand_name: submission.new_brand_name || '',
    new_brand_description: submission.new_brand_description || '',
    price_range: submission.price_range || '',
    strength: submission.strength || '',
    binder: submission.binder || '',
    dimensions: submission.dimensions || '',
    made_by: submission.made_by || '',
});

  const [newImage, setNewImage] = useState<File | null>(null);
  const [newBrandImage, setNewBrandImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [brandImageError, setBrandImageError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      
      if (error) {
        setImageError(error);
        e.target.value = '';
        return;
      }
      
      setNewImage(file);
      setImageError(null);
    }
  };

  const handleBrandImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      
      if (error) {
        setBrandImageError(error);
        e.target.value = '';
        return;
      }
      
      setNewBrandImage(file);
      setBrandImageError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    
    // Required fields
    formDataToSend.append('cigar_name', formData.cigar_name);
    formDataToSend.append('flavors', formData.flavors);
    formDataToSend.append('description', formData.description);

    // Brand info
    if (submission.brand) {
      formDataToSend.append('brand_id', String(formData.brand_id));
    } else {
      formDataToSend.append('new_brand_name', formData.new_brand_name);
      formDataToSend.append('new_brand_description', formData.new_brand_description);
      if (newBrandImage) {
        formDataToSend.append('brand_image', newBrandImage);
      }
    }

    // Optional characteristics
    if (formData.shape) formDataToSend.append('shape', formData.shape);
    if (formData.size) formDataToSend.append('size', formData.size);
    if (formData.color) formDataToSend.append('color', formData.color);
    if (formData.wrap_type) formDataToSend.append('wrap_type', formData.wrap_type);
    if (formData.filler) formDataToSend.append('filler', formData.filler);
    if (formData.country_of_origin) formDataToSend.append('country_of_origin', formData.country_of_origin);
    if (formData.aging) formDataToSend.append('aging', formData.aging.toString());
    if (formData.dimensions) formDataToSend.append('dimensions', formData.dimensions);
    if (formData.made_by) formDataToSend.append('made_by', formData.made_by);
    if (typeof formData.handmade === 'boolean') formDataToSend.append('handmade', String(formData.handmade));

    // New fields
    if (formData.price_range) formDataToSend.append('price_range', formData.price_range);
    if (formData.strength) formDataToSend.append('strength', formData.strength);
    if (formData.binder) formDataToSend.append('binder', formData.binder);

    // Images
    if (newImage) {
      formDataToSend.append('image', newImage);
    }

    try {
      const response = await axios.put(
        `/api/pending-submissions/${submission.id}`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      onSubmissionUpdated(response.data);
      onClose();
    } catch (err) {
      setError('Failed to update submission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Cigar Name *
            </label>
            <input
              type="text"
              name="cigar_name"
              value={formData.cigar_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Brand Information */}
          {submission.brand ? (
            <div>
              <label className="block text-sm font-medium mb-1">Current Brand</label>
              <input
                type="text"
                value={submission.brand.name}
                className="w-full p-2 border rounded-md bg-gray-50"
                disabled
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Brand Name *
                </label>
                <input
                  type="text"
                  name="new_brand_name"
                  value={formData.new_brand_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
              <label className="block text-sm font-medium mb-1">
              Brand Logo/Image *
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleBrandImageChange}
              className="w-full"
            />
            <p className="mt-2 text-sm text-gray-500">
              Maximum file size: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB. Supported formats: JPEG, PNG
            </p>
            {brandImageError && (
              <p className="mt-1 text-sm text-red-600">{brandImageError}</p>
            )}
            {submission.new_brand_image_key && !newBrandImage && (
              <img
                src={getImageUrl(submission.new_brand_image_key) || ''}
                alt="Current brand logo"
                className="mt-2 h-32 object-contain rounded-md"
              />
            )}
            {newBrandImage && (
              <p className="mt-1 text-sm text-green-600">
                New brand image selected: {newBrandImage.name} ({(newBrandImage.size / (1024 * 1024)).toFixed(2)}MB)
              </p>
            )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Brand Description *
                </label>
                <textarea
                  name="new_brand_description"
                  value={formData.new_brand_description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  required
                />
              </div>
            </>
          )}

          {/* Cigar Image */}
          <div>
          <label className="block text-sm font-medium mb-1">
            Cigar Image *
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
            className="w-full"
          />
          <p className="mt-2 text-sm text-gray-500">
            Maximum file size: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB. Supported formats: JPEG, PNG
          </p>
          {imageError && (
            <p className="mt-1 text-sm text-red-600">{imageError}</p>
          )}
          {submission.image_key && !newImage && (
            <img
              src={getImageUrl(submission.image_key) || ''}
              alt="Current cigar"
              className="mt-2 h-32 object-cover rounded-md"
            />
          )}
          {newImage && (
            <p className="mt-1 text-sm text-green-600">
              New image selected: {newImage.name} ({(newImage.size / (1024 * 1024)).toFixed(2)}MB)
            </p>
          )}
        </div>

          {/* Flavors */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Flavors (comma-separated) *
            </label>
            <input
              type="text"
              name="flavors"
              value={formData.flavors}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Optional Characteristics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Price Range</label>
              <select
                name="price_range"
                value={formData.price_range}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select price range</option>
                <option value="<$10">&lt;$10</option>
                <option value="$10.01 - $25">$10.01 - $25</option>
                <option value="$25.01 - $50">$25.01 - $50</option>
                <option value="$50.01 - $75">$50.01 - $75</option>
                <option value="$75.01 - $100">$75.01 - $100</option>
                <option value="$100.01<">$100.01&lt;</option>
              </select>
            </div>

            {/* Right Column */}
            {/* Wrap Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Wrapper</label>
              <input
                type="text"
                name="wrap_type"
                value={formData.wrap_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Connecticut, Habano"
              />
            </div>

            {/* Left Column */}
            {/* Strength */}
            <div>
              <label className="block text-sm font-medium mb-1">Strength</label>
              <input
                type="text"
                name="strength"
                value={formData.strength}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Full, Medium-Full"
              />
            </div>

            {/* Right Column */}
            {/* Filler */}
            <div>
              <label className="block text-sm font-medium mb-1">Filler</label>
              <input
                type="text"
                name="filler"
                value={formData.filler}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Long Filler, Short Filler"
              />
            </div>

            {/* Left Column */}
            {/* Shape */}
            <div>
              <label className="block text-sm font-medium mb-1">Shape</label>
              <input
                type="text"
                name="shape"
                value={formData.shape}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Parejos, Figurados"
              />
            </div>

            {/* Right Column */}
            {/* Binder */}
            <div>
              <label className="block text-sm font-medium mb-1">Binder</label>
              <input
                type="text"
                name="binder"
                value={formData.binder}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Cuba, Nicaragua"
              />
            </div>

            {/* Left Column */}
            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Corona, Robusto"
              />
            </div>

            {/* Right Column */}
            {/* Aging */}
            <div>
              <label className="block text-sm font-medium mb-1">Aging (years)</label>
              <input
                type="number"
                name="aging"
                value={formData.aging}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                min="0"
                placeholder="Enter aging (optional)"
              />
            </div>

            {/* Left Column */}
            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium mb-1">Dimensions</label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder='e.g., 6 1/8" by 50 ring gauge'
              />
            </div>

            {/* Right Column */}
            {/* Country of Origin */}
            <div>
              <label className="block text-sm font-medium mb-1">Country of Origin</label>
              <input
                type="text"
                name="country_of_origin"
                value={formData.country_of_origin}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter country (optional)"
              />
            </div>

            {/* Left Column */}
            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Maduro, Colorado"
              />
            </div>

            {/* Right Column */}
            {/* Made By */}
            <div>
              <label className="block text-sm font-medium mb-1">Made By</label>
              <input
                type="text"
                name="made_by"
                value={formData.made_by}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Habanos S.A."
              />
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
                  onChange={() => setFormData(prev => ({ ...prev, handmade: true }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Handmade</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-gray-900">
                <input
                  type="radio"
                  name="handmade"
                  checked={formData.handmade === false}
                  onChange={() => setFormData(prev => ({ ...prev, handmade: false }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Machine-made</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md resize-y"
              rows={4}
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubmissionForm;