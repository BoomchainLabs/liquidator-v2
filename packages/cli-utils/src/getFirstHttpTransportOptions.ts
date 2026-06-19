import type { HttpTransportConfig } from "viem";
import { getProviders } from "./getProviders.js";
import type { ProvidersSchema } from "./providers-schema.js";

export interface HttpTransportOptions {
  url?: string | undefined;
  config: HttpTransportConfig;
}

export function getFirstHttpTransportOptions(
  config: ProvidersSchema,
): HttpTransportOptions {
  const [provider] = getProviders(config);
  if (!provider) {
    throw new Error("No provider found");
  }
  return {
    url: provider.url,
    config: {
      ...provider.httpTransportOptions,
    },
  };
}
