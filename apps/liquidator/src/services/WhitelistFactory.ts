import type { Config } from "@gearbox-protocol/liquidator-v2-config";
import type { IFactory } from "di-at-home";
import { DI } from "../di.js";
import { type ILogger, Logger } from "../log/index.js";
import { CreditAccountWhitelist } from "./CreditAccountWhitelist.js";

@DI.Factory(DI.Whitelist)
export class WhitelistFactory implements IFactory<CreditAccountWhitelist, []> {
  @Logger("Whitelist")
  logger!: ILogger;

  @DI.Inject(DI.Config)
  config!: Config;

  produce(): CreditAccountWhitelist {
    return new CreditAccountWhitelist({
      // soft whitelist (endpoint) is only applied in non-optimistic mode
      url: this.config.optimistic ? undefined : this.config.whitelistUrl,
      network: this.config.network,
      // hard whitelist (config) is always available
      hard: this.config.hardWhitelist,
      logger: this.logger,
    });
  }
}
