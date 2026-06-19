export class CensoredString<V extends string = string> {
  readonly #value: V;
  readonly #censored: string;

  public static transform<T extends string>(
    value: T | CensoredString<T>,
  ): CensoredString<T> {
    if (value instanceof CensoredString) {
      return value;
    }
    return new CensoredString(value);
  }

  constructor(value: V) {
    this.#value = value;
    const visibleLen = Math.min(4, Math.floor(0.2 * value.length));
    if (visibleLen < 1) {
      this.#censored = "*".repeat(Math.min(8, value.length));
    } else {
      this.#censored =
        "*".repeat(Math.min(8, value.length - visibleLen)) +
        value.slice(-1 * visibleLen);
    }
  }

  public get value(): V {
    return this.#value;
  }

  public toString(): string {
    return this.#censored;
  }

  public toJSON(): string {
    return this.toString();
  }
}
