import { z } from "zod/v4";
import { CensoredString } from "../CensoredString.js";
import { boolLike } from "../schemas/schema-primitives.js";

export const TelegramConfig = z.object({
  type: z.literal("telegram"),
  token: z
    .union([z.string(), z.instanceof(CensoredString)])
    .transform(CensoredString.transform),
  alertsChannel: z
    .union([z.string().startsWith("-"), z.instanceof(CensoredString)])
    .transform(CensoredString.transform),
  /**
   * Optional channel to send notifications to
   * If not set, notifications will not be sent
   */
  notificationsChannel: z
    .union([z.string().startsWith("-"), z.instanceof(CensoredString)])
    .transform(CensoredString.transform)
    .optional(),
  prefix: z.string().optional(),
});

export type TelegramConfig = z.infer<typeof TelegramConfig>;

export const SlackConfig = z.object({
  type: z.literal("slack"),
  /**
   * Slack webhook URL for sending notifications
   */
  webhookUrl: z
    .union([z.string(), z.instanceof(CensoredString)])
    .transform(CensoredString.transform),
  /**
   * If true, only alerts will be sent. Informational notifications are suppressed
   */
  alertsOnly: boolLike().optional(),
});

export type SlackConfig = z.infer<typeof SlackConfig>;

export const NotificationConfig = z.discriminatedUnion("type", [
  TelegramConfig,
  SlackConfig,
]);

export type NotificationConfig = z.infer<typeof NotificationConfig>;

export const SignlConfig = z.object({
  apiKey: z
    .union([z.string(), z.instanceof(CensoredString)])
    .transform(CensoredString.transform),
  teamId: z
    .union([z.string(), z.instanceof(CensoredString)])
    .transform(CensoredString.transform),
});

export type SignlConfig = z.infer<typeof SignlConfig>;
