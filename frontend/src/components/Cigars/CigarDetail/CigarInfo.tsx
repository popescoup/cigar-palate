import React from 'react';
import type { Cigar } from '@/types/cigars';

interface CigarInfoProps {
  cigar: Cigar;
  className?: string;
}

export const CigarDescription: React.FC<CigarInfoProps> = ({ cigar, className }) => {
  if (!cigar.description) return null;
  
  return (
    <section className={className}>
      <h2 className="text-2xl font-light text-gray-900 mb-4">Description</h2>
      <p className="text-gray-700 text-lg leading-relaxed">
        {cigar.description}
      </p>
    </section>
  );
};

const CigarInfo: React.FC<CigarInfoProps> = ({ cigar }) => {
  // Define an interface for our info items
  interface InfoItem {
    label: string;
    value: string | null | undefined;
  }

  const leftColumnItems: InfoItem[] = [
    { 
      label: "Price Range", 
      value: cigar.price_range 
    },
    { 
      label: "Strength", 
      value: cigar.strength 
    },
    { 
      label: "Shape", 
      value: cigar.shape 
    },
    { 
      label: "Size", 
      value: cigar.size 
    },
    { 
      label: "Dimensions", 
      value: cigar.dimensions 
    },
    { 
      label: "Color", 
      value: cigar.color 
    },
    { 
      label: "Wrapper", 
      value: cigar.wrap_type 
    }
  ];

  const rightColumnItems: InfoItem[] = [
    { 
      label: "Filler", 
      value: cigar.filler 
    },
    { 
      label: "Binder", 
      value: cigar.binder 
    },
    { 
      label: "Aging", 
      value: cigar.aging ? `${cigar.aging} years` : null 
    },
    { 
      label: "Manufacturing Method", 
      value: typeof cigar.handmade === 'boolean' ? (cigar.handmade ? 'Handmade' : 'Machine-made') : null 
    },
    { 
      label: "Country of Origin", 
      value: cigar.country_of_origin 
    },
    { 
      label: "Made By", 
      value: cigar.made_by 
    }
  ];

  const filterValidItems = (items: InfoItem[]) => 
    items.filter(item => 
      item.value !== null && 
      item.value !== undefined && 
      item.value !== ''
    );

  const validLeftItems = filterValidItems(leftColumnItems);
  const validRightItems = filterValidItems(rightColumnItems);

  return (
    <section className="mt-2">
      <h2 className="text-2xl font-light text-gray-900 mb-4">Details</h2>
      {(validLeftItems.length > 0 || validRightItems.length > 0) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {validLeftItems.map((item, index) => (
              <div key={`left-${index}`}>
                <p className="text-sm text-gray-500">
                  {item.label}
                </p>
                <p className="text-lg text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {validRightItems.map((item, index) => (
              <div key={`right-${index}`}>
                <p className="text-sm text-gray-500">
                  {item.label}
                </p>
                <p className="text-lg text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No details available</p>
      )}
    </section>
  );
};

export default CigarInfo;