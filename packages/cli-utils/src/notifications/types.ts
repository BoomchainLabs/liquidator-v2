import type { Markdown } from "@vlad-yakovlev/telegram-md";
import type { Address } from "viem";
import type { NotificationConfig } from "./schema.js";

export type NotificationSeverity = "alert" | "notification";

/**
 * Notification that can be deduplicated
 */
export interface IDedupableNotification {
  /**
   * Messages with the same dedupe key will be throttled to avoid spam
   * If not provided, the message will not be throttled
   */
  dedupeKey?: string;
  /**
   * Function to calculate the wait time between deduped messages
   * If not provided, the default backoff will be used
   */
  throttleFn?: ThrottleFn;
  /**
   * Plaintext notification message
   */
  plain: string;
  /**
   * Optional markdown verison of notification message
   */
  md?: Markdown;
}

/**
 * Function to calculate the wait time between deduped messages
 * @param prevWaitMs The wait time of the previous message, 0 for the first message
 * @returns The wait time for the next message in milliseconds
 */
export type ThrottleFn = (prevWaitMs: number) => number;

/**
 * Implement this interface for your notification classes
 */
export interface INotification {
  /**
   * Function to generate the message for a recipient. Undefined means global message (gearbox notifications)
   * This allows us to put the logic to fan out message to different recipients inside the class that implements INotificationMessage,
   * and not to put this logic into the service that sends the notifications (you can still put it there, though)
   *
   * @param recipient The recipient to generate the message for, or undefined for the default/global recipient (gearbox notifications)
   * @returns The message for the recipient, or undefined for no message
   */
  messageFor: (
    recipient?: Address,
  ) => string | IDedupableNotification | undefined;
}

/**
 * A notification message, dumb strings and markdowns are treated as global notifications
 */
export type NotificationLike = string | IDedupableNotification | INotification;

/**
 * Notification service with deduplication and fan out logic
 */
export interface INotificationService {
  /**
   * Send an alert to Signl
   * @param message
   * @param dedupeKey
   *   Messages with the same dedupe key will be throttled to avoid spam
   *   If not provided, the message will not be throttled
   * @returns
   */
  signl: (message: string, dedupeKey?: string) => void;
  /**
   * Sends high priority notification
   * @param message
   * @returns
   */
  alert: (message: NotificationLike) => void;
  /**
   * Sends low priority notification
   * @param message
   * @returns
   */
  notify: (message: NotificationLike) => void;
  /**
   * Register a recipient for notifications
   * @param address The address of the recipient
   * @param options The options for the recipient
   */
  registerRecipient: (address: Address, options: NotificationConfig) => void;
}

export interface INotifier {
  /**
   * Sends notification
   * @param message
   * @returns
   */
  notify: (
    message: IDedupableNotification,
    severity: NotificationSeverity,
  ) => void;
}
