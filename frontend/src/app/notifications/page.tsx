'use client';

import React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { withSearchParams } from '@/hoc/withSearchParams';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const api = axios.create({
  withCredentials: true
});

interface Notification {
  id: number;
  type: 'follow' | 'thread' | 'reply' | 'review' | 'review_reply';
  actor: string;
  message: string;
  created_at: string;
  read: boolean;
  thread_id?: number;
  cigar_id?: number;
  reference_id?: number;
}

interface NotificationPage {
  notifications: Notification[];
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}


function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  // Fetch notifications with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
} = useInfiniteQuery({
    queryKey: ['notifications', 'all'],
    queryFn: async ({ pageParam }) => {
        const { data } = await api.get(`/api/notifications/all?page=${pageParam}`);
        return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: NotificationPage) => 
        lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
});

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('/api/notifications/clear-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      api.patch(`/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Handle intersection observer for infinite scroll
  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
        await markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'thread') {
        router.push(`/forum/thread/${notification.thread_id}`);
    } else if (notification.type === 'reply') {
        router.push(`/forum/thread/${notification.thread_id}?highlight=${notification.reference_id}`);
    } else if (notification.type === 'review') {
        router.push(`/cigars/${notification.cigar_id}?highlight=${notification.reference_id}`);
    } else if (notification.type === 'review_reply') {
        router.push(`/cigars/${notification.cigar_id}?highlight=${notification.reference_id}`);
    } else if (notification.type === 'follow') {
        router.push(`/profile/${notification.actor}`);
    }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'pending') {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (status === 'error') {
    return <div className="text-center p-10 text-red-600">Error loading notifications</div>;
  }

  const allNotifications = data.pages.flatMap(page => page.notifications);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Notifications</CardTitle>
          {allNotifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All notifications will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearAllMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="space-y-1">
              {allNotifications.map((notification, index) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors rounded-lg ${
                    !notification.read ? 'font-medium bg-gray-50' : ''
                  }`}
                  ref={index === allNotifications.length - 5 ? ref : undefined}
                >
                  <p>{notification.message}</p>
                  <span className="text-sm text-gray-500">
                    {formatDate(notification.created_at)}
                  </span>
                </button>
              ))}
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin inline-block" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withSearchParams(NotificationsPage);