export async function timeout(ms: number): Promise<void> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("timed out"));
    }, ms);
  });
}
