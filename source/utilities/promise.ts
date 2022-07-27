// source/utilities/promise.ts
// Exports Promise-related utilities.

/**
 * Waits for the passed promise to resolve, then returns the data and error
 * in an array, similar to Go.
 *
 * For example:
 *
 * ```
 * const [error, data] = await resolve(dance())
 * if (error) console.error(error)
 * else console.log(data)
 * ```
 *
 * @param promiseLike - The promise to resolve.
 * @returns An array containing the error as the first element, and the resolved
 *          data as the second element.
 */
export const resolve = async <T = unknown, E = Error>(
  promiseLike: Promise<T> | T,
): Promise<[E, undefined] | [undefined, T]> => {
  try {
    const data = await promiseLike;
    return [undefined, data];
  } catch (error: unknown) {
    return [error as E, undefined];
  }
};

/**
 * Promisifies the passed function.
 */
export { promisify } from 'node:util';
