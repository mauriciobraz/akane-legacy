export namespace EnvVars {
  export function getString(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing env var ${key}`);
    return value;
  }
}
