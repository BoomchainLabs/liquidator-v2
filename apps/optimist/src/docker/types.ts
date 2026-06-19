export interface AnvilOptions {
  trackId: string;
  forkURL: string;
  blockNumber: bigint;
  image: string;
  disableRateLimit?: boolean;
  anvilMemoryLimit?: number;
}

export interface ContainerInfo {
  id: string;
  imageVersion: string;
}

export interface ContainerResult {
  exitCode: number;
  error?: unknown;
}
