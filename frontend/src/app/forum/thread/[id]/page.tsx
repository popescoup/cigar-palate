// app/forum/thread/[id]/page.tsx

/*
	•	Renders the ThreadDetailPage component for a specific thread, using the thread’s id from the route parameters.
	•	Wraps the ThreadDetailPage component in a container with padding for consistent page styling, allowing users to view detailed information about the selected thread.
*/

import ThreadDetailPage from '@/components/Forum/ThreadDetailPage';

export default function ThreadPage({ params }: { params: { id: string } }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <ThreadDetailPage threadId={parseInt(params.id)} />
        </div>
    );
}