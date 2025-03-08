"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PendingSubmissionCard } from '@/components/Pending-Approval/PendingSubmissionCard';
import EditSubmissionForm from '@/components/Pending-Approval/EditSubmissionForm';
import { PendingSubmission } from '@/types/pending';
import { withSearchParams } from '@/hoc/withSearchParams';

// API functions
const fetchPendingSubmissions = async (): Promise<PendingSubmission[]> => {
  try {
    const { data } = await axios.get('/api/pending-submissions', {
      withCredentials: true
    });
    return data;
  } catch (error) {
    console.error("Error fetching pending submissions:", error);
    throw error;
  }
};

function PendingApprovals() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  
  // Local UI state
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [editingSubmission, setEditingSubmission] = useState<PendingSubmission | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch pending submissions
  const { 
    data: pendingSubmissions = [], 
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ['pendingSubmissions'],
    queryFn: fetchPendingSubmissions,
    enabled: !!currentUser?.isAdmin
  });

  // Approve submission mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await axios.post(
          `/api/pending-submissions/${id}/approve`,
          {},
          { withCredentials: true }
        );
        return { id, data: response.data };
      } catch (error) {
        console.error(`Error approving submission ${id}:`, error);
        throw error;
      }
    },
    onSuccess: ({ id }) => {
      queryClient.setQueryData(
        ['pendingSubmissions'],
        (old: PendingSubmission[] | undefined) => 
          old ? old.filter(sub => sub.id !== id) : []
      );
      setSelectedItems(prev => prev.filter(item => item !== id));
      setActionError(null);
    },
    onError: (error) => {
      console.error("Approval error:", error);
      setActionError(`Approval failed: ${(error as any)?.response?.data?.error || 'Unknown error'}`);
    }
  });

  // Decline submission mutation
  const declineMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      try {
        const response = await axios.post(
          `/api/pending-submissions/${id}/decline`,
          { notes },
          { withCredentials: true }
        );
        return { id, data: response.data };
      } catch (error) {
        console.error(`Error declining submission ${id}:`, error);
        throw error;
      }
    },
    onSuccess: ({ id }) => {
      queryClient.setQueryData(
        ['pendingSubmissions'],
        (old: PendingSubmission[] | undefined) => 
          old ? old.filter(sub => sub.id !== id) : []
      );
      setSelectedItems(prev => prev.filter(item => item !== id));
      setActionError(null);
    },
    onError: (error) => {
      console.error("Decline error:", error);
      setActionError(`Decline failed: ${(error as any)?.response?.data?.error || 'Unknown error'}`);
    }
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      try {
        const response = await axios.post(
          '/api/pending-submissions/bulk/approve',
          { ids },
          { withCredentials: true }
        );
        return { ids, data: response.data };
      } catch (error) {
        console.error("Error bulk approving submissions:", error);
        throw error;
      }
    },
    onSuccess: ({ ids }) => {
      queryClient.setQueryData(
        ['pendingSubmissions'],
        (old: PendingSubmission[] | undefined) => 
          old ? old.filter(sub => !ids.includes(sub.id)) : []
      );
      setSelectedItems([]);
      setActionError(null);
    },
    onError: (error) => {
      console.error("Bulk approve error:", error);
      setActionError(`Bulk approve failed: ${(error as any)?.response?.data?.error || 'Unknown error'}`);
    }
  });

  // Bulk decline mutation
  const bulkDeclineMutation = useMutation({
    mutationFn: async ({ ids, notes }: { ids: number[]; notes: string }) => {
      try {
        const response = await axios.post(
          '/api/pending-submissions/bulk/decline',
          { ids, notes },
          { withCredentials: true }
        );
        return { ids, data: response.data };
      } catch (error) {
        console.error("Error bulk declining submissions:", error);
        throw error;
      }
    },
    onSuccess: ({ ids }) => {
      queryClient.setQueryData(
        ['pendingSubmissions'],
        (old: PendingSubmission[] | undefined) => 
          old ? old.filter(sub => !ids.includes(sub.id)) : []
      );
      setSelectedItems([]);
      setAdminNotes('');
      setActionError(null);
    },
    onError: (error) => {
      console.error("Bulk decline error:", error);
      setActionError(`Bulk decline failed: ${(error as any)?.response?.data?.error || 'Unknown error'}`);
    }
  });

  // Handlers
  const handleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === pendingSubmissions.length
        ? []
        : pendingSubmissions.map(submission => submission.id)
    );
  };

  const handleSelect = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleApprove = async (id: number) => {
    setActionError(null);
    await approveMutation.mutateAsync(id);
  };

  const handleDecline = async (id: number) => {
    setActionError(null);
    if (!adminNotes.trim()) {
      setActionError("Admin notes are required for declining submissions");
      return;
    }
    await declineMutation.mutateAsync({ id, notes: adminNotes });
  };

  const handleBulkApprove = async () => {
    setActionError(null);
    if (selectedItems.length === 0) {
      setActionError("No items selected");
      return;
    }
    await bulkApproveMutation.mutateAsync(selectedItems);
  };

  const handleBulkDecline = async () => {
    setActionError(null);
    if (selectedItems.length === 0) {
      setActionError("No items selected");
      return;
    }
    if (!adminNotes.trim()) {
      setActionError("Admin notes are required for declining submissions");
      return;
    }
    await bulkDeclineMutation.mutateAsync({ ids: selectedItems, notes: adminNotes });
  };

  const handleSubmissionUpdated = (updatedSubmission: PendingSubmission) => {
    queryClient.setQueryData(
      ['pendingSubmissions'],
      (old: PendingSubmission[] | undefined) =>
        old?.map(sub =>
          sub.id === updatedSubmission.id ? updatedSubmission : sub
        )
    );
  };

  if (userLoading || isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser?.isAdmin) {
    return <div>Access denied</div>;
  }

  const isProcessing = approveMutation.isPending || declineMutation.isPending || 
                      bulkApproveMutation.isPending || bulkDeclineMutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Pending Approvals</h1>

      {isError && (
        <div className="mb-4 p-4 rounded-md bg-red-100 text-red-800 border border-red-300">
          {(error as Error)?.message || 'Failed to fetch pending items'}
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-4 rounded-md bg-red-100 text-red-800 border border-red-300">
          {actionError}
        </div>
      )}

      {pendingSubmissions.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedItems.length === pendingSubmissions.length}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span>Select All</span>
            </label>
            <span className="text-sm text-gray-500">
              {selectedItems.length} item(s) selected
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <textarea
                placeholder="Admin notes for declined items (required for declining)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2 border rounded-md text-sm text-gray-900"
                rows={2}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
              <button
                onClick={handleBulkApprove}
                disabled={isProcessing || selectedItems.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {bulkApproveMutation.isPending ? 'Processing...' : `Approve Selected (${selectedItems.length})`}
              </button>
              <button
                onClick={handleBulkDecline}
                disabled={isProcessing || selectedItems.length === 0 || !adminNotes.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {bulkDeclineMutation.isPending ? 'Processing...' : `Decline Selected (${selectedItems.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingSubmissions.map(submission => (
          <PendingSubmissionCard
            key={submission.id}
            submission={submission}
            selected={selectedItems.includes(submission.id)}
            processing={
              approveMutation.isPending && approveMutation.variables === submission.id || 
              declineMutation.isPending && declineMutation.variables?.id === submission.id ||
              bulkApproveMutation.isPending && selectedItems.includes(submission.id) ||
              bulkDeclineMutation.isPending && selectedItems.includes(submission.id)
            }
            onSelect={() => handleSelect(submission.id)}
            onApprove={() => handleApprove(submission.id)}
            onDecline={() => handleDecline(submission.id)}
            onEdit={() => setEditingSubmission(submission)}
          />
        ))}
      </div>

      {!isLoading && pendingSubmissions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No pending submissions to review
        </div>
      )}

      {editingSubmission && (
        <EditSubmissionForm
          submission={editingSubmission}
          open={true}
          onClose={() => setEditingSubmission(null)}
          onSubmissionUpdated={handleSubmissionUpdated}
        />
      )}
    </div>
  );
}

export default withSearchParams(PendingApprovals);