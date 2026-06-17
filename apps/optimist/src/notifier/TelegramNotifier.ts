import type { AxiosInstance } from "axios";
import axios, { isAxiosError } from "axios";
import axiosRetry from "axios-retry";
import type { Logger as ILogger } from "pino";

import type { TelegramConfig } from "../config/notifications";
import { Logger } from "../logger";
import type { INotification, INotifier } from "./types";

export default class TelegramNotifier implements INotifier {
  @Logger("TelegramNotifier")
  public readonly logger!: ILogger;

  #client: AxiosInstance;
  #alertsCh: string;
  #notificationsCh?: string;

  constructor(cfg: TelegramConfig) {
    this.#client = axios.create({
      baseURL: `https://api.telegram.org/bot${cfg.token.value}/sendMessage`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    axiosRetry(this.#client);
    this.#alertsCh = cfg.alertsChannel.value;
    this.#notificationsCh = cfg.notificationsChannel?.value;
  }

  public async notify(notifications: INotification[]): Promise<void> {
    for (const n of notifications) {
      await this.#notify(n);
    }
  }

  async #notify(notification: INotification): Promise<void> {
    if (!notification.severe && !this.#notificationsCh) {
      return;
    }
    await this.#sendToTelegram(
      notification.md.toString(),
      notification.severe ? this.#alertsCh : this.#notificationsCh!,
      notification.severe ? "alert" : "notification",
    );
  }

  async #sendToTelegram(
    text: string,
    channelId: string,
    severity = "notification",
  ): Promise<void> {
    console.log(`sending telegram ${severity} to channel ${channelId}...`);
    try {
      await this.#client.post("", {
        chat_id: channelId,
        parse_mode: "MarkdownV2",
        text,
      });
      this.logger.info(`telegram ${severity} sent successfully`);
    } catch (e) {
      if (isAxiosError(e)) {
        this.logger.error(
          {
            status: e.status,
            description: e.response?.data?.description,
            text,
          },
          `cannot send telegram ${severity}`,
        );
      } else {
        this.logger.error({ text }, `cannot send telegram ${severity}: ${e}`);
      }
    }
  }
}
