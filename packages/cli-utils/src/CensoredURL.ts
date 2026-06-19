/**
 * Assumes that host is always visible, and the secret part is in path or query
 */
export class CensoredURL {
  readonly #value: string;
  readonly #censored: string;

  public static transform(value: string | CensoredURL): CensoredURL {
    if (value instanceof CensoredURL) {
      return value;
    }
    return new CensoredURL(value);
  }

  constructor(url: string) {
    this.#value = url;
    if (
      url.includes("127.0.0.1") ||
      url.includes("localhost") ||
      url.includes("host.docker.internal")
    ) {
      this.#censored = url;
    } else {
      try {
        const u = new URL(url);
        if (u.username || u.password) {
          u.username = u.username ? "****" : "";
          u.password = u.password ? "****" : "";
        }
        u.pathname = "/";
        u.search = "";
        this.#censored = `${u.href}******`;
      } catch {
        const visibleLen = Math.min(4, Math.floor(0.2 * url.length));
        if (visibleLen < 1) {
          this.#censored = "*".repeat(Math.min(8, url.length));
        } else {
          this.#censored =
            "*".repeat(Math.min(8, url.length - visibleLen)) +
            url.slice(-1 * visibleLen);
        }
      }
    }
  }

  public get value(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#censored;
  }

  public toJSON(): string {
    return this.toString();
  }
}
