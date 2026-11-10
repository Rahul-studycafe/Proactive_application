"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CheckSquare,
  Receipt,
  FolderArchive,
  Key,
  CalendarCheck,
  ShieldCheck,
  Zap,
  ExternalLink,
  Trash2,
  Settings2,
  Inbox
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetInAppNotificationsQuery,
  useGetUnreadInAppCountQuery,
  useMarkInAppAsReadMutation,
  useMarkAllInAppAsReadMutation,
  useDeleteInAppNotificationMutation,
} from "@/lib/services/api";
import {
  InAppNotificationItem,
  NotificationCategory,
} from "@/lib/types/notification";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_ICONS: Record<
  NotificationCategory,
  { icon: React.ElementType; color: string; bg: string }
> = {
  tasks: {
    icon: CheckSquare,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  billing: {
    icon: Receipt,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  documents: {
    icon: FolderArchive,
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  dsc_vault: {
    icon: Key,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  attendance: {
    icon: CalendarCheck,
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  security: {
    icon: ShieldCheck,
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
  },
  subscription: {
    icon: Zap,
    color: "text-yellow-500 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  },
};

export function NotificationBellDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Lightweight 25s polling for the badge counter
  const { data: countData } = useGetUnreadInAppCountQuery(undefined, {
    pollingInterval: 25000,
  });
  const unreadCount = countData?.unreadCount ?? 0;

  // Notification list queries when popover is open
  const { data: listData, isLoading } = useGetInAppNotificationsQuery(
    { unreadOnly: activeTab === "unread", limit: 25 },
    { skip: !isOpen }
  );

  const [markAsRead] = useMarkInAppAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllInAppAsReadMutation();
  const [deleteNotification] = useDeleteInAppNotificationMutation();

  const notifications = listData?.notifications || [];

  const handleNotificationClick = async (notif: InAppNotificationItem) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }

    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-in fade-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-lg border border-border bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 font-medium bg-primary/10 text-primary border-primary/20"
              >
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isMarkingAll}
              onClick={handleMarkAllRead}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b bg-muted/10 px-4 py-1.5 gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "all"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "unread"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-destructive" />
            )}
          </button>
        </div>

        {/* List Content */}
        <ScrollArea className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <Inbox className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No notifications
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "unread"
                  ? "You've read all your notifications!"
                  : "We'll notify you when new events arrive."}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const categoryConfig =
                CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.tasks;
              const Icon = categoryConfig.icon;
              const relativeTime = notif.createdAt
                ? formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                  })
                : "";

              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex items-start gap-3 p-3 text-left transition-colors cursor-pointer hover:bg-accent/40 ${
                    !notif.isRead
                      ? "bg-primary/[0.04] dark:bg-primary/[0.06]"
                      : ""
                  }`}
                >
                  {/* Category Icon */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${categoryConfig.bg} ${categoryConfig.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          !notif.isRead
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 block mt-1">
                      {relativeTime}
                    </span>
                  </div>

                  {/* Dismiss button on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, notif._id)}
                      title="Dismiss"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              router.push("/settings?module=user-notifications");
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 justify-center"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Manage Notification Preferences</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

