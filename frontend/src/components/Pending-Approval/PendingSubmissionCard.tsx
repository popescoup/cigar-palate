// src/components/Pending-Approval/PendingSubmissionCard.tsx
import { PendingSubmission, CardProps } from '@/types/pending';
import { getImageUrl } from '@/utils/imageUtils';

interface PendingSubmissionCardProps extends CardProps {
  submission: PendingSubmission;
  onEdit: () => void;
}

export const PendingSubmissionCard = ({
  submission,
  selected,
  processing,
  onSelect,
  onApprove,
  onDecline,
  onEdit
}: PendingSubmissionCardProps) => (
  <div className={`bg-white rounded-lg shadow p-4 border ${selected ? 'border-blue-500' : 'border-gray-200'}`}>
    <div className="flex items-start justify-between mb-4">
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="h-4 w-4 text-blue-600 rounded"
      />
      <span className="text-sm text-gray-500">
        Submitted by: {submission.submitter?.username}
      </span>
    </div>

    {submission.image_key && (
      <img
        src={getImageUrl(submission.image_key) || ''}
        alt={submission.cigar_name}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
    )}

    <h3 className="text-lg font-semibold mb-2 text-gray-900">{submission.cigar_name}</h3>
    
    {/* Brand Information Section */}
    {submission.new_brand_name ? (
      <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <div className="mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            New Brand: {submission.new_brand_name}
          </span>
        </div>

        {submission.new_brand_image_key && (
          <div className="mb-2">
            <p className="text-sm text-gray-600 mb-1">Brand Logo:</p>
            <img
              src={getImageUrl(submission.new_brand_image_key) || ''}
              alt={`${submission.new_brand_name} logo`}
              className="w-32 h-32 object-contain rounded-md border border-yellow-200"
            />
          </div>
        )}

        {submission.new_brand_description && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Brand Description:</p>
            <p className="text-sm text-gray-800">{submission.new_brand_description}</p>
          </div>
        )}
      </div>
    ) : submission.brand && (
      <div className="mb-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Brand: {submission.brand.name}
        </span>
      </div>
    )}

    <dl className="grid grid-cols-2 gap-4">
      <div className="break-words">
        <dt className="text-gray-500">Flavors:</dt>
        <dd className="text-gray-900">{submission.flavors}</dd>
      </div>
      
      {/* Left Column */}
      {submission.price_range && (
        <div className="break-words">
          <dt className="text-gray-500">Price Range:</dt>
          <dd className="text-gray-900">{submission.price_range}</dd>
        </div>
      )}

      {submission.strength && (
        <div className="break-words">
          <dt className="text-gray-500">Strength:</dt>
          <dd className="text-gray-900">{submission.strength}</dd>
        </div>
      )}

      {submission.shape && (
        <div className="break-words">
          <dt className="text-gray-500">Shape:</dt>
          <dd className="text-gray-900">{submission.shape}</dd>
        </div>
      )}

      {submission.size && (
        <div className="break-words">
          <dt className="text-gray-500">Size:</dt>
          <dd className="text-gray-900">{submission.size}</dd>
        </div>
      )}

      {submission.dimensions && (
        <div className="break-words">
          <dt className="text-gray-500">Dimensions:</dt>
          <dd className="text-gray-900">{submission.dimensions}</dd>
        </div>
      )}

      {submission.color && (
        <div className="break-words">
          <dt className="text-gray-500">Color:</dt>
          <dd className="text-gray-900">{submission.color}</dd>
        </div>
      )}

      {/* Right Column */}
      {submission.wrap_type && (
        <div className="break-words">
          <dt className="text-gray-500">Wrap Type:</dt>
          <dd className="text-gray-900">{submission.wrap_type}</dd>
        </div>
      )}

      {submission.filler && (
        <div className="break-words">
          <dt className="text-gray-500">Filler:</dt>
          <dd className="text-gray-900">{submission.filler}</dd>
        </div>
      )}

      {submission.binder && (
        <div className="break-words">
          <dt className="text-gray-500">Binder:</dt>
          <dd className="text-gray-900">{submission.binder}</dd>
        </div>
      )}

      {submission.aging !== null && submission.aging !== undefined && (
        <div className="break-words">
          <dt className="text-gray-500">Aging:</dt>
          <dd className="text-gray-900">{submission.aging} years</dd>
        </div>
      )}

      {submission.country_of_origin && (
        <div className="break-words">
          <dt className="text-gray-500">Origin:</dt>
          <dd className="text-gray-900">{submission.country_of_origin}</dd>
        </div>
      )}

      {submission.made_by && (
        <div className="break-words">
          <dt className="text-gray-500">Made By:</dt>
          <dd className="text-gray-900">{submission.made_by}</dd>
        </div>
      )}

      {submission.handmade !== null && submission.handmade !== undefined && (
        <div className="break-words">
          <dt className="text-gray-500">Handmade:</dt>
          <dd className="text-gray-900">{submission.handmade ? 'Yes' : 'No'}</dd>
        </div>
      )}
    </dl>

    {submission.description && (
      <div className="mt-4 mb-4">
        <dt className="text-gray-500 text-sm">Description:</dt>
        <dd className="text-gray-900 text-sm mt-1">{submission.description}</dd>
      </div>
    )}

    <div className="flex gap-2">
      <button
        onClick={onApprove}
        disabled={processing}
        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400"
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : 'Approve'}
      </button>
      <button
        onClick={onEdit}
        disabled={processing}
        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        Edit
      </button>
      <button
        onClick={onDecline}
        disabled={processing}
        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-400"
      >
        Decline
      </button>
    </div>
  </div>
);