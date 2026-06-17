import type { Markdown } from "@vlad-yakovlev/telegram-md";
import { md } from "@vlad-yakovlev/telegram-md";

/**
 * Telegram markdown does not support any forms of lists, so use bullet point utf character
 * @param items
 * @returns
 */
export function mdList(items?: Markdown[]): Markdown {
  if (!items?.length) {
    return md``;
  }
  return md.join(
    items.map(i => md`• ${i}`),
    "\n",
  );
}
