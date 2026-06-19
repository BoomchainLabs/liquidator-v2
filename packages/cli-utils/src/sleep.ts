// Mirror of packages/shared/src/sleep.ts; keep in sync.
export async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
