declare class TypeID<const T extends string> {
    private prefix;
    private suffix;
    constructor(prefix: T, suffix?: string);
    getType(): T;
    getSuffix(): string;
    asType<const U extends string>(prefix: U): TypeID<U>;
    toUUIDBytes(): Uint8Array;
    toUUID(): string;
    toString(): T extends "" ? string : `${T}_${string}`;
    static fromString<const T extends string>(str: string, prefix?: T): TypeID<T>;
    static fromUUIDBytes<const T extends string>(prefix: T, bytes: Uint8Array): TypeID<T>;
    static fromUUID<const T extends string>(prefix: T, uuid: string): TypeID<T>;
}
declare function typeid<T extends string>(): TypeID<"">;
declare function typeid<T extends string>(prefix: T): TypeID<T>;
declare function typeid<T extends string>(prefix: T, suffix: string): TypeID<T>;

type TypeId<T> = string & {
    __type: T;
};
declare function typeidUnboxed<T extends string>(prefix?: T, suffix?: string): TypeId<T>;
/**
 * Constructs a TypeId from a string representation, optionally validating against a provided prefix.
 * This function splits the input `typeId` string by an underscore `_` to separate the prefix and suffix.
 * If the `typeId` contains no underscore, it is assumed to be a suffix with an empty prefix.
 * If a `prefix` is provided, it must match the prefix part of the `typeId`, or an error is thrown.
 *
 * @param {string} typeId - The string representation of the TypeId to be parsed.
 * @param {T} [prefix] - An optional prefix to validate against the prefix in the `typeId`.
 * @returns {TypeId<T>} A new TypeId instance constructed from the parsed `typeId`.
 * @throws {Error} If the `typeId` format is invalid, the prefix is empty when there's a separator,
 *                 or there's a prefix mismatch when a `prefix` is provided.
 * @template T - A string literal type that extends string.
 */
declare function fromString<T extends string>(typeId: string, prefix?: T): TypeId<T>;
/**
 * Parses a TypeId string into its prefix and suffix components.
 *
 * @param {TypeId<T>} typeId - The TypeId string to parse.
 * @returns {{ prefix: T; suffix: string }} An object containing the prefix and suffix of the TypeId.
 * @throws {Error} If the TypeId format is invalid (not exactly two parts separated by an underscore).
 *
 * @example
 * // For a valid TypeId 'example_00041061050r3gg28a1c60t3gf'
 * const { prefix, suffix } = parseTypeId('example_00041061050r3gg28a1c60t3gf');
 * console.log(prefix); // 'example'
 * console.log(suffix); // '00041061050r3gg28a1c60t3gf'
 *
 * @example
 * // Throws an error for invalid TypeId format
 * try {
 *   parseTypeId('invalidTypeId');
 * } catch (error) {
 *   console.error(error.message); // 'Invalid TypeId format: invalidTypeId'
 * }
 */
declare function parseTypeId<T extends string>(typeId: TypeId<T>): {
    prefix: T;
    suffix: string;
};
/**
 * Retrieves the prefix from a TypeId.
 *
 * @param {TypeId<T>} typeId - The TypeId from which to extract the prefix.
 * @returns {T} The prefix of the TypeId.
 */
declare function getType<T extends string>(typeId: TypeId<T>): T;
/**
 * Retrieves the suffix from a TypeId.
 *
 * @param {TypeId<T>} typeId - The TypeId from which to extract the suffix.
 * @returns {string} The suffix of the TypeId.
 */
declare function getSuffix<T extends string>(typeId: TypeId<T>): string;
declare function toUUIDBytes<T extends string>(typeId: TypeId<T>): Uint8Array;
declare function toUUID<T extends string>(typeId: TypeId<T>): string;
declare function fromUUIDBytes(prefix: string, bytes: Uint8Array): TypeId<typeof prefix>;
declare function fromUUID<T extends string>(uuid: string, prefix?: T): TypeId<T>;

export { TypeID, TypeId, fromString, fromUUID, fromUUIDBytes, getSuffix, getType, parseTypeId, toUUID, toUUIDBytes, typeid, typeidUnboxed };
