import type { Markdown } from "@vlad-yakovlev/telegram-md";

export interface INotifier {
  notify: (notifications: INotification[]) => Promise<void>;
}

export interface INotification {
  severe: boolean;
  md: Markdown;
}
