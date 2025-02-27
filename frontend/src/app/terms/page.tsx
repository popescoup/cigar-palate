'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-gray-900">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none [&>h2]:text-[1.75rem] [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-10 [&>h2]:mb-5 [&>h2]:pb-2 [&>h2]:border-b-2 [&>h2]:border-gray-200 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-6 [&>h3]:mb-4 [&>p]:my-4 [&>p]:leading-relaxed [&>ul]:my-3 [&>ul>li]:my-1.5">
              <h2>1. Age Requirements and Verification</h2>
              <p>By accessing and using this website, you certify that:</p>
              <ul>
                <li>You are of legal age to purchase and consume tobacco products in your jurisdiction (minimum 21 years in the United States)</li>
                <li>You understand this is a tobacco-related website containing content about cigars</li>
                <li>You accept responsibility for verifying your age upon registration</li>
                <li>You will not attempt to circumvent age verification measures</li>
              </ul>

              <h2>2. Account Registration and Security</h2>
              <p>To participate in certain features of our website, including forums and review submissions, you must register for an account. When registering, you agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information</li>
                <li>Keep your account credentials secure</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Not create multiple accounts or transfer your account to others</li>
              </ul>

              <h2>3. Intellectual Property and Content Usage Restrictions</h2>
              <p>All content on this website, including but not limited to text, graphics, logos, reviews, ratings, forum posts, images, and other materials ("Content") is protected by intellectual property rights and is subject to the following restrictions:</p>
              <ul>
                <li>The Content is provided solely for your personal, non-commercial use in connection with engaging with our cigar community</li>
                <li>You may not reproduce, duplicate, copy, sell, resell, distribute, publish, or exploit any Content for any commercial purpose without our express written permission</li>
                <li>You may not use our Content to create, promote, or support any competing service or platform</li>
                <li>You may not scrape, data-mine, or systematically collect or store our Content for any purpose</li>
                <li>You may not modify, translate, reverse engineer, or create derivative works based on our Content</li>
                <li>Personal, non-commercial sharing of individual reviews or forum posts is permitted only with proper attribution to our site and the original author</li>
              </ul>

              <h3>3.1 Permitted Uses</h3>
              <p>You may:</p>
              <ul>
                <li>View and interact with the Content while using our services as intended</li>
                <li>Share individual reviews or forum posts on social media for personal, non-commercial purposes with proper attribution</li>
                <li>Quote brief excerpts of Content in personal communications, provided you maintain all copyright and attribution notices</li>
              </ul>

              <h3>3.2 Enforcement</h3>
              <p>We reserve the right to:</p>
              <ul>
                <li>Monitor for violations of these content usage restrictions</li>
                <li>Take legal action against unauthorized use of our Content</li>
                <li>Terminate accounts that violate these restrictions</li>
                <li>Seek monetary damages for commercial misuse of our Content</li>
              </ul>

              <h2>4. User-Generated Content</h2>
              <h3>4.1 Content Submission</h3>
              <p>You may submit the following types of content:</p>
              <ul>
                <li>Cigar reviews (subject to admin approval)</li>
                <li>Forum posts and comments</li>
                <li>Cigar ratings and scores</li>
                <li>Images related to cigars and reviews</li>
              </ul>

              <h3>4.2 Content Guidelines</h3>
              <p>All submitted content must:</p>
              <ul>
                <li>Be original or properly attributed</li>
                <li>Not violate any third-party rights</li>
                <li>Not contain harmful, offensive, or inappropriate material</li>
                <li>Not include commercial spam or unauthorized advertising</li>
                <li>Comply with all applicable tobacco-related regulations</li>
              </ul>

              <h3>4.3 Content License</h3>
              <p>By submitting content, you:</p>
              <ul>
                <li>Retain ownership of your content</li>
                <li>Grant us a worldwide, non-exclusive, royalty-free license to use, modify, reproduce, and distribute your content</li>
                <li>Allow us to display your username alongside your content</li>
              </ul>

              <h2>5. Affiliate Links and Commercial Relationships</h2>
              <h3>5.1 Affiliate Disclosure</h3>
              <p>Our website contains affiliate links to cigar retailers. When you click these links:</p>
              <ul>
                <li>We may earn a commission on resulting purchases</li>
                <li>Your browsing activity may be tracked via cookies</li>
                <li>Third-party retailers may collect your information</li>
              </ul>

              <h3>5.2 Product Information</h3>
              <ul>
                <li>Reviews and ratings reflect personal opinions</li>
                <li>We don't guarantee product availability or pricing</li>
                <li>All purchasing decisions are your responsibility</li>
              </ul>

              <h2>6. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Misrepresent your age or identity</li>
                <li>Share harmful or malicious content</li>
                <li>Harass other users or engage in hate speech</li>
                <li>Collect user information without consent</li>
                <li>Attempt to circumvent website security</li>
                <li>Use the website for any unlawful purpose</li>
                <li>Create multiple accounts to manipulate ratings or reviews</li>
              </ul>

              <h2>7. Termination</h2>
              <p>We reserve the right to:</p>
              <ul>
                <li>Remove any content without notice</li>
                <li>Suspend or terminate accounts for violations</li>
                <li>Ban users who repeatedly violate these terms</li>
                <li>Modify or discontinue any service</li>
              </ul>

              <h2>8. Disclaimers and Limitations</h2>
              <h3>8.1 Health Warnings</h3>
              <ul>
                <li>Tobacco products are addictive and harmful to health</li>
                <li>Our content is for informational purposes only</li>
                <li>Consult health professionals for medical advice</li>
              </ul>

              <h3>8.2 Liability Limitations</h3>
              <p>We are not liable for:</p>
              <ul>
                <li>Accuracy of user-generated content</li>
                <li>Third-party retailer actions or products</li>
                <li>Loss or damage from website use</li>
              </ul>

              <h2>9. Changes to Terms</h2>
              <ul>
                <li>We may modify these terms at any time</li>
                <li>Continued use constitutes acceptance of changes</li>
                <li>Material changes will be announced on the website</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;