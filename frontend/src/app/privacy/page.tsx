'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-gray-900">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none [&>h2]:text-[1.75rem] [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-10 [&>h2]:mb-5 [&>h2]:pb-2 [&>h2]:border-b-2 [&>h2]:border-gray-200 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-6 [&>h3]:mb-4 [&>p]:my-4 [&>p]:leading-relaxed [&>ul]:my-3 [&>ul>li]:my-1.5">
              <h2>1. Information We Collect</h2>
              <h3>1.1 Account Information</h3>
              <p>When you register, we collect:</p>
              <ul>
                <li>Email address</li>
                <li>Username</li>
                <li>Password (encrypted)</li>
                <li>First name</li>
                <li>Optional: Last name</li>
              </ul>

              <h3>1.2 User-Generated Content</h3>
              <p>We collect and store:</p>
              <ul>
                <li>Reviews and ratings you submit</li>
                <li>Forum posts and comments</li>
                <li>Images you upload</li>
                <li>Profile information you provide</li>
              </ul>

              <h3>1.3 Automatic Information</h3>
              <p>We automatically collect:</p>
              <ul>
                <li>IP address and location data</li>
                <li>Browser and device information</li>
                <li>Cookies and tracking data</li>
                <li>Website usage statistics</li>
              </ul>

              <h3>1.4 Affiliate Link Data</h3>
              <p>When you interact with affiliate links:</p>
              <ul>
                <li>Click tracking information</li>
                <li>Purchase conversion data</li>
                <li>Retailer-provided transaction details</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul>
                <li>Maintain and improve our services</li>
                <li>Process and display user-generated content</li>
                <li>Track affiliate link performance</li>
                <li>Verify age and prevent misuse</li>
                <li>Communicate with users</li>
                <li>Analyze usage patterns</li>
                <li>Ensure compliance with tobacco regulations</li>
              </ul>

              <h2>3. Cookie Usage</h2>
              <h3>3.1 Types of Cookies</h3>
              <p>We use:</p>
              <ul>
                <li>Essential cookies for site functionality</li>
                <li>Authentication cookies for user sessions</li>
                <li>Affiliate tracking cookies</li>
                <li>Analytics cookies</li>
              </ul>

              <h3>3.2 Cookie Control</h3>
              <p>You can:</p>
              <ul>
                <li>Adjust browser settings to control cookies</li>
                <li>Opt-out of non-essential cookies</li>
                <li>Note that some features may not work without cookies</li>
              </ul>

              <h2>4. Information Sharing</h2>
              <h3>4.1 With Your Consent</h3>
              <ul>
                <li>When you choose to make content public</li>
                <li>When you interact with affiliate links</li>
              </ul>

              <h3>4.2 For Legal Requirements</h3>
              <ul>
                <li>To comply with laws</li>
                <li>To respond to legal requests</li>
                <li>To protect our rights</li>
              </ul>

              <h3>4.3 With Service Providers</h3>
              <ul>
                <li>Analytics providers</li>
                <li>Hosting services</li>
                <li>Affiliate network partners</li>
              </ul>

              <h2>5. Data Security</h2>
              <p>We implement security measures including:</p>
              <ul>
                <li>Encrypted data transmission</li>
                <li>Secure password storage</li>
                <li>Regular security updates</li>
                <li>Access controls</li>
              </ul>

              <h2>6. User Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Withdraw consent</li>
                <li>Lodge complaints with authorities</li>
              </ul>

              <h2>7. International Users</h2>
              <ul>
                <li>We primarily target users in the Americas and Europe</li>
                <li>Data is processed in accordance with applicable laws</li>
                <li>Users from all regions are welcome, subject to local laws</li>
              </ul>

              <h2>8. Changes to Privacy Policy</h2>
              <ul>
                <li>We may update this policy</li>
                <li>Changes will be posted on this page</li>
                <li>Material changes will be notified via email</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;