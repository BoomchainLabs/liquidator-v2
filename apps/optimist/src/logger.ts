import { createPinoCensor } from "@gearbox-protocol/cli-utils";
import type { IFactory } from "di-at-home";
import type { DestinationStream, Logger as ILogger } from "pino";
import { multistream, pino } from "pino";
import pinoLoki from "pino-loki";
import pinoPretty from "pino-pretty";

import type { Config } from "./config";
import DI from "./di";

@DI.Factory(DI.Logger)
class LoggerFactory implements IFactory<ILogger, [string]> {
  @DI.Inject(DI.Config)
  public readonly config!: Config;

  #logger: ILogger;

  constructor() {
    let transport: DestinationStream = pinoPretty();
    const { loki, executionId, logLevel } = this.config;

    if (loki) {
      const lokiTransport = pinoLoki({
        host: loki.host,
        basicAuth: loki.auth
          ? {
              username: loki.auth?.username.value,
              password: loki.auth?.password.value,
            }
          : undefined,
        batching: false,
        labels: {
          job: "optimist",
          runner: "true",
          ...(executionId ? { execution_id: executionId } : {}),
        },
      });
      transport = multistream([
        { stream: process.stdout, level: "debug" },
        { stream: lokiTransport, level: "debug" },
      ]);
    }

    this.#logger = pino(
      {
        level: logLevel,
        base: {},
        hooks: { streamWrite: createPinoCensor(this.config) },
        formatters: {
          bindings: () => ({}),
          level: label => {
            return {
              level: label,
            };
          },
        },
      },
      transport,
    );
  }

  public produce(name: string): ILogger {
    return this.#logger.child({ name });
  }
}

export const Logger = (name: string) => DI.Transient(DI.Logger, name);
