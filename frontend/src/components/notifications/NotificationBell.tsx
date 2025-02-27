import React from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/utils/axiosConfig';  // Import the shared axios instance
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
}

const NotificationBell = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);

  // Fetch notifications
  const { data, error } = useQuery<NotificationResponse>({
    queryKey: ['notifications', 'recent'],
    queryFn: () => api.get('/api/notifications/recent').then(res => res.data),
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once to avoid excessive failed requests
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      api.patch(`/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/api/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsReadMutation.mutate(notification.id);
    }

    setIsOpen(false);

    // Navigate based on notification type
    switch (notification.type) {
      case 'thread':
        router.push(`/forum/thread/${notification.thread_id}`);
        break;
      case 'reply':
        router.push(`/forum/thread/${notification.thread_id}?highlight=${notification.reference_id}`);
        break;
      case 'review':
      case 'review_reply':
        router.push(`/cigars/${notification.cigar_id}?highlight=${notification.reference_id}`);
        break;
      case 'follow':
        router.push(`/profile/${notification.actor}`);
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {data?.unread_count ? (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-600" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {data?.unread_count ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all as read
            </Button>
          ) : null}
        </div>
        <ScrollArea className="h-[calc(100vh-20rem)] min-h-[250px]">
          {error ? (
            <div className="p-4 text-center text-sm text-red-500">
              Failed to load notifications
            </div>
          ) : data?.notifications?.length ? (
            data.notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors",
                  !notification.read && "font-medium bg-gray-50"
                )}
              >
                <p className="text-sm">{notification.message}</p>
                <span className="text-xs text-gray-500 mt-1">
                  {formatDate(notification.created_at)}
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t">
          <Link
            href="/notifications"
            className="block text-center text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;