// app/forum/page.tsx

/*
	•	Defines a metadata object with a title and description for the cigar forum page.
	•	Serves as the main route file for the forum page, rendering the ForumPage component where users can discuss cigars and connect with other enthusiasts.
*/

import ForumPage from '@/components/Forum/ForumPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cigar Forum',
  description: 'Discuss cigars, share experiences, and connect with other cigar enthusiasts.',
};

export default function ForumRoute() {
  return <ForumPage />;
}