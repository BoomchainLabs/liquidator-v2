import {
  CensoredString,
  CensoredURL,
  zommandRegistry,
} from "@gearbox-protocol/cli-utils";
import { z } from "zod/v4";

export const LokiConfig = z
  .url()
  .optional()
  .transform(url => {
    if (!url) {
      return undefined;
    }
    const parsed = new URL(url);
    return {
      url: new CensoredURL(url),
      host: `${parsed.protocol}//${parsed.host}`,
      auth: parsed.password
        ? {
            username: new CensoredString(decodeURIComponent(parsed.username)),
            password: new CensoredString(decodeURIComponent(parsed.password)),
          }
        : undefined,
    };
  })
  .register(zommandRegistry, {
    flags: "--loki-url <url>",
    description: "Loki URL",
    env: "LOKI_URL",
  });

export type LokiConfig = z.infer<typeof LokiConfig>;
