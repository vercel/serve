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
 * @param promise - The promise to resolve.
 * @returns An array containing the error as the first element, and the resolved
 *          data as the second element.
 */
export const resolve = <T = unknown, E = Error>(
  promise: Promise<T>,
): Promise<[E, undefined] | [undefined, T]> =>
  promise
    .then<[undefined, T]>((data) => [undefined, data])
    .catch<[E, undefined]>((error) => [error, undefined]);

/**
 * Promisifies the passed function.
 */
export { promisify } from 'node:util';
