import { version as packageVersion } from "../package.json";

export const version = process.env.OPTIMIST_VERSION || packageVersion;
export const tag = process.env.OPTIMIST_TAG || "dev";
