import type { Address } from "viem";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NotificationsService } from "./NotificationsService.js";
import type {
  IDedupableNotification,
  INotification,
  NotificationSeverity,
} from "./types.js";

const telegramSpy = vi.fn();

const GLOBAL_BOT_TOKEN = "global-token";
const RECIPIENT_BOT_TOKEN = "recipient-token";
const RECIPIENT: Address = "0x1234567890123456789012345678901234567890";
const SIGNL_API_KEY = "test-signl-api-key-12345";
const SIGNL_TEAM_ID = "test-team-id-67890";

// Mock TelegramNotifier before importing the service
vi.mock("./TelegramNotifier", () => {
  return {
    TelegramNotifier: class {
      public readonly token: CensoredString;
      constructor(opts: { token: CensoredString }) {
        this.token = opts.token;
      }

      notify(
        message: IDedupableNotification,
        severity: NotificationSeverity,
      ): void {
        telegramSpy(this.token.value, message, severity);
      }
    },
  };
});

import { CensoredString } from "../CensoredString.js";

let notificationsService: NotificationsService;

beforeEach(() => {
  vi.clearAllMocks();
  notificationsService = new NotificationsService({
    notifications: [
      {
        type: "telegram",
        token: new CensoredString(GLOBAL_BOT_TOKEN),
        alertsChannel: new CensoredString("alerts"),
        notificationsChannel: new CensoredString("notifications"),
      },
      {
        recipient: RECIPIENT,
        type: "telegram",
        token: new CensoredString(RECIPIENT_BOT_TOKEN),
        alertsChannel: new CensoredString("recipient-alerts"),
        notificationsChannel: new CensoredString("recipient-notifications"),
      },
    ],
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

it("should call global notifier with string message", () => {
  const message = "Simple string alert";

  notificationsService.alert(message);

  expect(telegramSpy).toHaveBeenCalledTimes(1);
  expect(telegramSpy).toHaveBeenCalledWith(
    GLOBAL_BOT_TOKEN,
    { plain: message },
    "alert",
  );
});

it("should call global notifier with IDedupableNotification", () => {
  const message: IDedupableNotification = {
    plain: "Dedupable alert",
    dedupeKey: "test-key",
  };

  notificationsService.alert(message);

  expect(telegramSpy).toHaveBeenCalledTimes(1);
  expect(telegramSpy).toHaveBeenCalledWith(GLOBAL_BOT_TOKEN, message, "alert");
});

it("should call global notifier with global only INotification", () => {
  const message: INotification = {
    messageFor: (recipient?: Address) =>
      recipient ? undefined : "Notification message",
  };

  notificationsService.alert(message);

  expect(telegramSpy).toHaveBeenCalledTimes(1);
  expect(telegramSpy).toHaveBeenCalledWith(
    GLOBAL_BOT_TOKEN,
    { plain: "Notification message" },
    "alert",
  );
});

it("should call global notifier with INotification that returns IDedupableNotification", () => {
  const dedupableMessage: IDedupableNotification = {
    plain: "Dedupable from INotification",
    dedupeKey: "notification-key",
  };
  const message: INotification = {
    messageFor: (recipient?: Address) =>
      recipient ? undefined : dedupableMessage,
  };

  notificationsService.alert(message);

  expect(telegramSpy).toHaveBeenCalledTimes(1);
  expect(telegramSpy).toHaveBeenCalledWith(
    GLOBAL_BOT_TOKEN,
    dedupableMessage,
    "alert",
  );
});

it("should call both notifiers with INotification that returns message for both", () => {
  const message: INotification = {
    messageFor: (recipient?: Address) => {
      if (!recipient) {
        return "Global alert";
      }
      if (recipient === RECIPIENT) {
        return "Recipient alert";
      }
      return undefined;
    },
  };

  notificationsService.alert(message);

  expect(telegramSpy).toHaveBeenCalledTimes(2);
  expect(telegramSpy).toHaveBeenNthCalledWith(
    1,
    GLOBAL_BOT_TOKEN,
    { plain: "Global alert" },
    "alert",
  );
  expect(telegramSpy).toHaveBeenNthCalledWith(
    2,
    RECIPIENT_BOT_TOKEN,
    { plain: "Recipient alert" },
    "alert",
  );
});

it("should only call recipient notifier when INotification returns undefined for global", () => {
  const message: INotification = {
    messageFor: (recipient?: Address) => {
      // Only return message for recipient
      return recipient === RECIPIENT ? "Recipient only" : undefined;
    },
  };

  notificationsService.alert(message);

  // Only recipient notifier should be called
  expect(telegramSpy).toHaveBeenCalledTimes(1);
  expect(telegramSpy).toHaveBeenCalledWith(
    RECIPIENT_BOT_TOKEN,
    { plain: "Recipient only" },
    "alert",
  );
});

it("should call both notifiers with IDedupableNotification from INotification", () => {
  const globalDedupable: IDedupableNotification = {
    plain: "Global dedupable",
    dedupeKey: "global-key",
  };
  const recipientDedupable: IDedupableNotification = {
    plain: "Recipient dedupable",
    dedupeKey: "recipient-key",
  };

  const message: INotification = {
    messageFor: (recipient?: Address) => {
      if (!recipient) {
        return globalDedupable;
      }
      if (recipient === RECIPIENT) {
        return recipientDedupable;
      }
      return undefined;
    },
  };

  notificationsService.alert(message);

  expect(telegramSpy).toHaveBeenCalledTimes(2);
  expect(telegramSpy).toHaveBeenNthCalledWith(
    1,
    GLOBAL_BOT_TOKEN,
    globalDedupable,
    "alert",
  );
  expect(telegramSpy).toHaveBeenNthCalledWith(
    2,
    RECIPIENT_BOT_TOKEN,
    recipientDedupable,
    "alert",
  );
});

it("should send request to Signl API", async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true }),
  });

  // Create service with signl config using CensoredString
  const serviceWithSignl = new NotificationsService({
    notifications: [],
    signl: {
      apiKey: new CensoredString(SIGNL_API_KEY),
      teamId: new CensoredString(SIGNL_TEAM_ID),
    },
  });

  const message = "Test alert";
  serviceWithSignl.signl(message);

  // Wait for fetch to be called and verify all parameters
  await vi.waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      `https://connect.signl4.com/api/v2/alerts?x-s4-api-key=${SIGNL_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "emergency",
          severity: 0,
          teamId: SIGNL_TEAM_ID,
          text: message,
          title: "GEARBOX ALERT",
        }),
      },
    );
  });
});
