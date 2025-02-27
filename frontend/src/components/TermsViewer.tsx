// components/TermsViewer.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useCallback, useEffect } from "react";

interface TermsViewerProps {
  onClose: () => void;
}

export const TermsViewer = ({ onClose }: TermsViewerProps) => {
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [handleEscapeKey]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-3xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-xl font-bold">Terms of Service</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close terms of service"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-sm max-w-none space-y-6">
            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">1. Age Requirements and Verification</h2>
              <p className="my-4 leading-relaxed">By accessing and using this website, you certify that:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">You are of legal age to purchase and consume tobacco products in your jurisdiction (minimum 21 years in the United States)</li>
                <li className="my-1.5">You understand this is a tobacco-related website containing content about cigars</li>
                <li className="my-1.5">You accept responsibility for verifying your age upon registration</li>
                <li className="my-1.5">You will not attempt to circumvent age verification measures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">2. Account Registration and Security</h2>
              <p className="my-4 leading-relaxed">To participate in certain features of our website, including forums and review submissions, you must register for an account. When registering, you agree to:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Provide accurate, current, and complete information</li>
                <li className="my-1.5">Maintain and update your information</li>
                <li className="my-1.5">Keep your account credentials secure</li>
                <li className="my-1.5">Accept responsibility for all activities under your account</li>
                <li className="my-1.5">Not create multiple accounts or transfer your account to others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">3. Intellectual Property and Content Usage Restrictions</h2>
              <p className="my-4 leading-relaxed">All content on this website, including but not limited to text, graphics, logos, reviews, ratings, forum posts, images, and other materials ("Content") is protected by intellectual property rights and is subject to the following restrictions:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">The Content is provided solely for your personal, non-commercial use in connection with engaging with our cigar community</li>
                <li className="my-1.5">You may not reproduce, duplicate, copy, sell, resell, distribute, publish, or exploit any Content for any commercial purpose without our express written permission</li>
                <li className="my-1.5">You may not use our Content to create, promote, or support any competing service or platform</li>
                <li className="my-1.5">You may not scrape, data-mine, or systematically collect or store our Content for any purpose</li>
                <li className="my-1.5">You may not modify, translate, reverse engineer, or create derivative works based on our Content</li>
                <li className="my-1.5">Personal, non-commercial sharing of individual reviews or forum posts is permitted only with proper attribution to our site and the original author</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">3.1 Permitted Uses</h3>
              <p className="my-4 leading-relaxed">You may:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">View and interact with the Content while using our services as intended</li>
                <li className="my-1.5">Share individual reviews or forum posts on social media for personal, non-commercial purposes with proper attribution</li>
                <li className="my-1.5">Quote brief excerpts of Content in personal communications, provided you maintain all copyright and attribution notices</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">3.2 Enforcement</h3>
              <p className="my-4 leading-relaxed">We reserve the right to:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Monitor for violations of these content usage restrictions</li>
                <li className="my-1.5">Take legal action against unauthorized use of our Content</li>
                <li className="my-1.5">Terminate accounts that violate these restrictions</li>
                <li className="my-1.5">Seek monetary damages for commercial misuse of our Content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">4. User-Generated Content</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">4.1 Content Submission</h3>
              <p className="my-4 leading-relaxed">You may submit the following types of content:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Cigar reviews (subject to admin approval)</li>
                <li className="my-1.5">Forum posts and comments</li>
                <li className="my-1.5">Cigar ratings and scores</li>
                <li className="my-1.5">Images related to cigars and reviews</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">4.2 Content Guidelines</h3>
              <p className="my-4 leading-relaxed">All submitted content must:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Be original or properly attributed</li>
                <li className="my-1.5">Not violate any third-party rights</li>
                <li className="my-1.5">Not contain harmful, offensive, or inappropriate material</li>
                <li className="my-1.5">Not include commercial spam or unauthorized advertising</li>
                <li className="my-1.5">Comply with all applicable tobacco-related regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">4.3 Content License</h3>
              <p className="my-4 leading-relaxed">By submitting content, you:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Retain ownership of your content</li>
                <li className="my-1.5">Grant us a worldwide, non-exclusive, royalty-free license to use, modify, reproduce, and distribute your content</li>
                <li className="my-1.5">Allow us to display your username alongside your content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">5. Affiliate Links and Commercial Relationships</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">5.1 Affiliate Disclosure</h3>
              <p className="my-4 leading-relaxed">Our website contains affiliate links to cigar retailers. When you click these links:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">We may earn a commission on resulting purchases</li>
                <li className="my-1.5">Your browsing activity may be tracked via cookies</li>
                <li className="my-1.5">Third-party retailers may collect your information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">5.2 Product Information</h3>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Reviews and ratings reflect personal opinions</li>
                <li className="my-1.5">We don't guarantee product availability or pricing</li>
                <li className="my-1.5">All purchasing decisions are your responsibility</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">6. Prohibited Conduct</h2>
              <p className="my-4 leading-relaxed">You agree not to:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Misrepresent your age or identity</li>
                <li className="my-1.5">Share harmful or malicious content</li>
                <li className="my-1.5">Harass other users or engage in hate speech</li>
                <li className="my-1.5">Collect user information without consent</li>
                <li className="my-1.5">Attempt to circumvent website security</li>
                <li className="my-1.5">Use the website for any unlawful purpose</li>
                <li className="my-1.5">Create multiple accounts to manipulate ratings or reviews</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">7. Termination</h2>
              <p className="my-4 leading-relaxed">We reserve the right to:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Remove any content without notice</li>
                <li className="my-1.5">Suspend or terminate accounts for violations</li>
                <li className="my-1.5">Ban users who repeatedly violate these terms</li>
                <li className="my-1.5">Modify or discontinue any service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">8. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">8.1 Health Warnings</h3>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Tobacco products are addictive and harmful to health</li>
                <li className="my-1.5">Our content is for informational purposes only</li>
                <li className="my-1.5">Consult health professionals for medical advice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">8.2 Liability Limitations</h3>
              <p className="my-4 leading-relaxed">We are not liable for:</p>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">Accuracy of user-generated content</li>
                <li className="my-1.5">Third-party retailer actions or products</li>
                <li className="my-1.5">Loss or damage from website use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-5">9. Changes to Terms</h2>
              <ul className="my-3 list-disc pl-6">
                <li className="my-1.5">We may modify these terms at any time</li>
                <li className="my-1.5">Continued use constitutes acceptance of changes</li>
                <li className="my-1.5">Material changes will be announced on the website</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};