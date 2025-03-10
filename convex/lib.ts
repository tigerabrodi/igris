export async function handlePromise<PromiseResult>(
  promise: Promise<PromiseResult>
): Promise<[PromiseResult, null] | [null, Error]> {
  try {
    const result = await promise
    return [result, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}
