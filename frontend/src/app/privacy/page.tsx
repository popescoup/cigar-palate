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
  <li>Unique identifiers associated with your session</li>
  <li>Product interaction history</li>
  <li>Referral source information</li>
  <li>Timestamps of affiliate link engagement</li>
  <li>Commission-related transaction data</li>
</ul>
<p>This information helps us improve our affiliate partnerships, provide more relevant recommendations, and ensure proper attribution for commissions. We retain this data for up to 24 months to accommodate longer affiliate tracking windows.</p>

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
<p>We respect your privacy and are selective about how we share your information. We may share certain information in the following circumstances:</p>

<h3>4.1 With Your Consent</h3>
<p>We share your information when:</p>
<ul>
  <li>You choose to make your content public on our platform</li>
  <li>You interact with affiliate links, requiring data sharing with retailers and affiliate networks</li>
  <li>You explicitly authorize us to share specific information with third parties</li>
  <li>You request us to integrate with third-party services</li>
</ul>

<h3>4.2 For Legal Requirements</h3>
<p>We may disclose your information:</p>
<ul>
  <li>To comply with applicable laws, regulations, and legal processes</li>
  <li>To respond to valid legal requests from public authorities</li>
  <li>To protect our rights, privacy, safety, or property</li>
  <li>To detect, prevent, or address fraud and security issues</li>
  <li>In connection with an investigation of suspected or actual illegal activity</li>
  <li>To enforce our Terms of Service and other agreements</li>
</ul>

<h3>4.3 With Service Providers</h3>
<p>We share certain information with trusted third parties who provide services on our behalf:</p>
<ul>
  <li>Analytics providers who help us understand user behavior and improve our services</li>
  <li>Hosting and cloud infrastructure providers who store and deliver our content</li>
  <li>Affiliate network partners who process commissions and track conversions</li>
  <li>Email service providers who help us communicate with you</li>
  <li>Customer support services who assist with inquiries</li>
  <li>Payment processors who handle transactions (without storing your full payment details)</li>
  <li>Security services that help protect our platform</li>
</ul>
<p>These service providers are contractually obligated to use your information solely for providing the services we've requested and in compliance with this privacy policy.</p>

<h3>4.4 Business Transfers</h3>
<p>If we're involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our website of any change in ownership or uses of your personal information, as well as any choices you may have regarding your personal information.</p>

<h3>4.5 Aggregated or De-identified Data</h3>
<p>We may share aggregated or de-identified information that cannot reasonably be used to identify you. This might include usage statistics, demographic trends, or other analytical data. This information may be used for industry analysis, marketing, advertising, and improving our services.</p>

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
                <li>We may update these policies</li>
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