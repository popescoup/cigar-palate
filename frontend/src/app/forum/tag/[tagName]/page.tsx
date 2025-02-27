
/*
	•	Renders the TagThreadsPage component to display all threads associated with a specific tag.
	•	Decodes the tagName parameter from the route to ensure special characters are correctly interpreted, allowing users to browse threads by tag.
*/

import TagThreadsPage from '@/components/Forum/TagThreadsPage';

export default function TagPage({ params }: { params: { tagName: string } }) {
    return <TagThreadsPage tagName={decodeURIComponent(params.tagName)} />;
}