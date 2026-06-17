import { CensoredString } from "@gearbox-protocol/cli-utils";
import { z } from "zod/v4";

export const TelegramConfig = z.object({
  /**
   * When undefined, defaults to all curators together (aka Gearbox internal)
   */
  curator: z.string().optional(),
  type: z.literal("telegram"),
  token: z.string().transform(CensoredString.transform),
  alertsChannel: z.string().startsWith("-").transform(CensoredString.transform),
  /**
   * Optional channel to send notifications to
   * If not set, notifications will not be sent
   */
  notificationsChannel: z
    .string()
    .startsWith("-")
    .transform(CensoredString.transform)
    .optional(),
});

export type TelegramConfig = z.infer<typeof TelegramConfig>;

export const NotificationsConfig = z.discriminatedUnion("type", [
  TelegramConfig,
]);

export type NotificationsConfig = z.infer<typeof NotificationsConfig>;
