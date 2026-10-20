import crypto from "crypto";
import { getDb } from "./client";

export interface DbNotification {
  id: string;
  user_id: string | null; // null = broadcast to all users
  title: string;
  message: string;
  type: "token" | "offer" | "tool" | "security" | "update" | "purchase" | "admin";
  badge: string | null;
  link: string | null;
  action_text: string | null;
  read: number; // 0 or 1
  created_at: string;
}

export interface CreateNotificationParams {
  userId?: string | null;
  title: string;
  message: string;
  type?: "token" | "offer" | "tool" | "security" | "update" | "purchase" | "admin";
  badge?: string | null;
  link?: string | null;
  actionText?: string | null;
}

export const notificationsRepo = {
  /**
   * Create a notification record in SQLite
   */
  create(params: CreateNotificationParams): DbNotification {
    const db = getDb();
    const id = `notif_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const notif: DbNotification = {
      id,
      user_id: params.userId || null,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type || "admin",
      badge: params.badge ? params.badge.trim() : null,
      link: params.link ? params.link.trim() : null,
      action_text: params.actionText ? params.actionText.trim() : null,
      read: 0,
      created_at: now,
    };

    try {
      db.prepare(`
        INSERT INTO user_notifications (
          id, user_id, title, message, type, badge, link, action_text, read, created_at
        ) VALUES (
          @id, @user_id, @title, @message, @type, @badge, @link, @action_text, @read, @created_at
        )
      `).run(notif);
    } catch (err) {
      console.error("[notificationsRepo.create error]", err);
    }

    return notif;
  },

  /**
   * Get all notifications applicable to a user (user-specific + global broadcasts)
   */
  getUserNotifications(userId: string, limit = 50): DbNotification[] {
    const db = getDb();
    try {
      return db
        .prepare(`
          SELECT * FROM user_notifications
          WHERE user_id = ? OR user_id IS NULL
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .all(userId, limit) as DbNotification[];
    } catch (err) {
      console.error("[notificationsRepo.getUserNotifications error]", err);
      return [];
    }
  },

  /**
   * Get unread count for a user
   */
  getUnreadCount(userId: string): number {
    const db = getDb();
    try {
      const row = db
        .prepare(`
          SELECT COUNT(*) as count FROM user_notifications
          WHERE (user_id = ? OR user_id IS NULL) AND read = 0
        `)
        .get(userId) as { count: number } | undefined;
      return row ? row.count : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead(id: string): boolean {
    const db = getDb();
    try {
      const res = db
        .prepare("UPDATE user_notifications SET read = 1 WHERE id = ?")
        .run(id);
      return res.changes > 0;
    } catch {
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): boolean {
    const db = getDb();
    try {
      const res = db
        .prepare("UPDATE user_notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL")
        .run(userId);
      return res.changes > 0;
    } catch {
      return false;
    }
  },

  /**
   * Delete a notification
   */
  delete(id: string): boolean {
    const db = getDb();
    try {
      const res = db
        .prepare("DELETE FROM user_notifications WHERE id = ?")
        .run(id);
      return res.changes > 0;
    } catch {
      return false;
    }
  },
};
