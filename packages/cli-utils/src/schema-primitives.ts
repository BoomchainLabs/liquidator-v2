import { getAddress, isAddress } from "viem";
import { z } from "zod/v4";

export const boolLike = () =>
  z.any().transform(v => {
    if (typeof v === "string") {
      return ["true", "1"].includes(v.toLowerCase());
    }
    return Boolean(v);
  });

export const stringArrayLike = () =>
  z.union([z.array(z.string()), z.string().transform(val => val.split(","))]);

export const optionalStringArrayLike = () =>
  stringArrayLike()
    .optional()
    .transform(v => (v?.length ? v : undefined));

/**
 * Like Address from abitype/zod, but converts an address into an address that is checksum encoded.
 */
export const addressLike = () =>
  z.string().transform((val, ctx) => {
    if (!isAddress(val)) {
      ctx.issues.push({
        code: "custom",
        message: `invalid address ${val}`,
        input: ctx.value,
      });
    }

    return getAddress(val);
  });

export const addressArrayLike = () =>
  stringArrayLike().pipe(z.array(addressLike()));

export const optionalAddressArrayLike = () =>
  stringArrayLike()
    .pipe(z.array(addressLike()))
    .optional()
    .transform(v => (v?.length ? v : undefined));
