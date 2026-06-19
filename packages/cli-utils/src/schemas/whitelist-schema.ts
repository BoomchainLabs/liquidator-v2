// Mirror of packages/shared/src/whitelist-schema.ts; keep in sync.
import { NetworkType } from "@gearbox-protocol/sdk";
import { z } from "zod/v4";
import { addressLike } from "./schema-primitives.js";

export const WhitelistItemsSchema = z.object({
  network: NetworkType,
  addresses: z.array(addressLike()).min(1),
  reason: z.string().default(""),
  issue: z.string().optional(),
  expiresAt: z.number().optional(),
});

export type WhitelistItemsSchema = z.infer<typeof WhitelistItemsSchema>;

export const WhitelistItemSchema = z.object({
  network: NetworkType,
  category: z.string(),
  address: addressLike(),
  reason: z.string().default(""),
  issue: z.string().optional(),
  contractType: z.string().optional(),
  createdAt: z.number(),
  expiresAt: z.number().optional(),
});

export type WhitelistItemSchema = z.infer<typeof WhitelistItemSchema>;
