/**
 * Utility type definitions for general use.
 */

/**
 * Ensures an array is non-empty.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Makes all properties of an object optional, recursively.
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Record where keys are of type K and values are of type V,
 * but all properties are optional.
 */
export type TypedRecord<K extends string | number | symbol, V> = {
  [P in K]?: V;
};

/**
 * Extracts the type from a Promise.
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Makes certain properties of T required.
 */
export type RequiredProps<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/**
 * Makes certain properties of T optional.
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};
