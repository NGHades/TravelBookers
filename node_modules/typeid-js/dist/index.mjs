// src/typeid.ts
import { stringify as stringify2 } from "uuid";

// src/parse_uuid.ts
function parseUUID(uuid) {
  let v;
  const arr = new Uint8Array(16);
  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 255;
  arr[2] = v >>> 8 & 255;
  arr[3] = v & 255;
  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 255;
  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 255;
  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 255;
  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v / 4294967296 & 255;
  arr[12] = v >>> 24 & 255;
  arr[13] = v >>> 16 & 255;
  arr[14] = v >>> 8 & 255;
  arr[15] = v & 255;
  return arr;
}

// src/base32.ts
var alphabet = "0123456789abcdefghjkmnpqrstvwxyz";
var dec = new Uint8Array([
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  255,
  18,
  19,
  255,
  20,
  21,
  255,
  22,
  23,
  24,
  25,
  26,
  255,
  27,
  28,
  29,
  30,
  31,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255
]);
function encode(src) {
  const dst = new Array(26).fill("");
  if (src.length !== 16) {
    throw new Error(
      `Invalid length. Expected 16 bytes, got ${src.length}. Input: ${src}`
    );
  }
  dst[0] = alphabet[(src[0] & 224) >> 5];
  dst[1] = alphabet[src[0] & 31];
  dst[2] = alphabet[(src[1] & 248) >> 3];
  dst[3] = alphabet[(src[1] & 7) << 2 | (src[2] & 192) >> 6];
  dst[4] = alphabet[(src[2] & 62) >> 1];
  dst[5] = alphabet[(src[2] & 1) << 4 | (src[3] & 240) >> 4];
  dst[6] = alphabet[(src[3] & 15) << 1 | (src[4] & 128) >> 7];
  dst[7] = alphabet[(src[4] & 124) >> 2];
  dst[8] = alphabet[(src[4] & 3) << 3 | (src[5] & 224) >> 5];
  dst[9] = alphabet[src[5] & 31];
  dst[10] = alphabet[(src[6] & 248) >> 3];
  dst[11] = alphabet[(src[6] & 7) << 2 | (src[7] & 192) >> 6];
  dst[12] = alphabet[(src[7] & 62) >> 1];
  dst[13] = alphabet[(src[7] & 1) << 4 | (src[8] & 240) >> 4];
  dst[14] = alphabet[(src[8] & 15) << 1 | (src[9] & 128) >> 7];
  dst[15] = alphabet[(src[9] & 124) >> 2];
  dst[16] = alphabet[(src[9] & 3) << 3 | (src[10] & 224) >> 5];
  dst[17] = alphabet[src[10] & 31];
  dst[18] = alphabet[(src[11] & 248) >> 3];
  dst[19] = alphabet[(src[11] & 7) << 2 | (src[12] & 192) >> 6];
  dst[20] = alphabet[(src[12] & 62) >> 1];
  dst[21] = alphabet[(src[12] & 1) << 4 | (src[13] & 240) >> 4];
  dst[22] = alphabet[(src[13] & 15) << 1 | (src[14] & 128) >> 7];
  dst[23] = alphabet[(src[14] & 124) >> 2];
  dst[24] = alphabet[(src[14] & 3) << 3 | (src[15] & 224) >> 5];
  dst[25] = alphabet[src[15] & 31];
  return dst.join("");
}
function decode(s) {
  if (s.length !== 26) {
    throw new Error(
      `Invalid length. Expected 26 bytes, got ${s.length}. Input: ${s}`
    );
  }
  const encoder = new TextEncoder();
  const v = encoder.encode(s);
  if (dec[v[0]] === 255 || dec[v[1]] === 255 || dec[v[2]] === 255 || dec[v[3]] === 255 || dec[v[4]] === 255 || dec[v[5]] === 255 || dec[v[6]] === 255 || dec[v[7]] === 255 || dec[v[8]] === 255 || dec[v[9]] === 255 || dec[v[10]] === 255 || dec[v[11]] === 255 || dec[v[12]] === 255 || dec[v[13]] === 255 || dec[v[14]] === 255 || dec[v[15]] === 255 || dec[v[16]] === 255 || dec[v[17]] === 255 || dec[v[18]] === 255 || dec[v[19]] === 255 || dec[v[20]] === 255 || dec[v[21]] === 255 || dec[v[22]] === 255 || dec[v[23]] === 255 || dec[v[24]] === 255 || dec[v[25]] === 255) {
    throw new Error("Invalid base32 character");
  }
  const id = new Uint8Array(16);
  id[0] = dec[v[0]] << 5 | dec[v[1]];
  id[1] = dec[v[2]] << 3 | dec[v[3]] >> 2;
  id[2] = (dec[v[3]] & 3) << 6 | dec[v[4]] << 1 | dec[v[5]] >> 4;
  id[3] = (dec[v[5]] & 15) << 4 | dec[v[6]] >> 1;
  id[4] = (dec[v[6]] & 1) << 7 | dec[v[7]] << 2 | dec[v[8]] >> 3;
  id[5] = (dec[v[8]] & 7) << 5 | dec[v[9]];
  id[6] = dec[v[10]] << 3 | dec[v[11]] >> 2;
  id[7] = (dec[v[11]] & 3) << 6 | dec[v[12]] << 1 | dec[v[13]] >> 4;
  id[8] = (dec[v[13]] & 15) << 4 | dec[v[14]] >> 1;
  id[9] = (dec[v[14]] & 1) << 7 | dec[v[15]] << 2 | dec[v[16]] >> 3;
  id[10] = (dec[v[16]] & 7) << 5 | dec[v[17]];
  id[11] = dec[v[18]] << 3 | dec[v[19]] >> 2;
  id[12] = (dec[v[19]] & 3) << 6 | dec[v[20]] << 1 | dec[v[21]] >> 4;
  id[13] = (dec[v[21]] & 15) << 4 | dec[v[22]] >> 1;
  id[14] = (dec[v[22]] & 1) << 7 | dec[v[23]] << 2 | dec[v[24]] >> 3;
  id[15] = (dec[v[24]] & 7) << 5 | dec[v[25]];
  return id;
}

// src/unboxed/typeid.ts
import { stringify, v7 } from "uuid";

// src/prefix.ts
function isValidPrefix(str) {
  if (str.length > 63) {
    return false;
  }
  let code;
  let i;
  let len;
  for (i = 0, len = str.length; i < len; i += 1) {
    code = str.charCodeAt(i);
    const isLowerAtoZ = code > 96 && code < 123;
    const isUnderscore = code === 95;
    if ((i === 0 || i === len - 1) && !isLowerAtoZ) {
      return false;
    }
    if (!(isLowerAtoZ || isUnderscore)) {
      return false;
    }
  }
  return true;
}

// src/unboxed/error.ts
var InvalidPrefixError = class extends Error {
  constructor(prefix) {
    super(`Invalid prefix "${prefix}". Must be at most 63 ASCII letters [a-z_]`);
    this.name = "InvalidPrefixError";
  }
};
var PrefixMismatchError = class extends Error {
  constructor(expected, actual) {
    super(`Invalid TypeId. Prefix mismatch. Expected ${expected}, got ${actual}`);
    this.name = "PrefixMismatchError";
  }
};
var EmptyPrefixError = class extends Error {
  constructor(typeId) {
    super(`Invalid TypeId. Prefix cannot be empty when there's a separator: ${typeId}`);
    this.name = "EmptyPrefixError";
  }
};
var InvalidSuffixLengthError = class extends Error {
  constructor(length) {
    super(`Invalid length. Suffix should have 26 characters, got ${length}`);
    this.name = "InvalidSuffixLengthError";
  }
};
var InvalidSuffixCharacterError = class extends Error {
  constructor(firstChar) {
    super(`Invalid suffix. First character "${firstChar}" must be in the range [0-7]`);
    this.name = "InvalidSuffixCharacterError";
  }
};
var TypeIDConversionError = class extends Error {
  constructor(actualPrefix, expectedPrefix) {
    super(`Cannot convert TypeID of type ${actualPrefix} to type ${expectedPrefix}`);
    this.name = "TypeIDConversionError";
  }
};

// src/unboxed/typeid.ts
function typeidUnboxed(prefix = "", suffix = "") {
  if (!isValidPrefix(prefix)) {
    throw new InvalidPrefixError(prefix);
  }
  let finalSuffix;
  if (suffix) {
    finalSuffix = suffix;
  } else {
    const buffer = new Uint8Array(16);
    v7(void 0, buffer);
    finalSuffix = encode(buffer);
  }
  if (finalSuffix.length !== 26) {
    throw new InvalidSuffixLengthError(finalSuffix.length);
  }
  if (finalSuffix[0] > "7") {
    throw new InvalidSuffixCharacterError(finalSuffix[0]);
  }
  decode(finalSuffix);
  if (prefix === "") {
    return finalSuffix;
  } else {
    return `${prefix}_${finalSuffix}`;
  }
}
function fromString(typeId, prefix) {
  let p;
  let s;
  const underscoreIndex = typeId.lastIndexOf("_");
  if (underscoreIndex === -1) {
    p = "";
    s = typeId;
  } else {
    p = typeId.substring(0, underscoreIndex);
    s = typeId.substring(underscoreIndex + 1);
    if (!p) {
      throw new EmptyPrefixError(typeId);
    }
  }
  if (!s) {
    throw new InvalidSuffixLengthError(0);
  }
  if (prefix && p !== prefix) {
    throw new PrefixMismatchError(prefix, p);
  }
  return typeidUnboxed(p, s);
}
function parseTypeId(typeId) {
  return { prefix: getType(typeId), suffix: getSuffix(typeId) };
}
function getType(typeId) {
  const underscoreIndex = typeId.lastIndexOf("_");
  if (underscoreIndex === -1) {
    return "";
  }
  return typeId.substring(0, underscoreIndex);
}
function getSuffix(typeId) {
  const underscoreIndex = typeId.lastIndexOf("_");
  if (underscoreIndex === -1) {
    return typeId;
  }
  return typeId.substring(underscoreIndex + 1);
}
function toUUIDBytes(typeId) {
  return decode(getSuffix(typeId));
}
function toUUID(typeId) {
  return stringify(toUUIDBytes(typeId));
}
function fromUUIDBytes(prefix, bytes) {
  const suffix = encode(bytes);
  return prefix ? `${prefix}_${suffix}` : suffix;
}
function fromUUID(uuid, prefix) {
  const suffix = encode(parseUUID(uuid));
  return prefix ? `${prefix}_${suffix}` : suffix;
}

// src/typeid.ts
var TypeID = class {
  constructor(prefix, suffix = "") {
    this.prefix = prefix;
    this.suffix = suffix;
    const typeIdRaw = typeidUnboxed(prefix, suffix);
    this.prefix = getType(typeIdRaw);
    this.suffix = getSuffix(typeIdRaw);
  }
  getType() {
    return this.prefix;
  }
  getSuffix() {
    return this.suffix;
  }
  asType(prefix) {
    const self = this;
    if (self.prefix !== prefix) {
      throw new TypeIDConversionError(self.prefix, prefix);
    }
    return self;
  }
  toUUIDBytes() {
    return decode(this.suffix);
  }
  toUUID() {
    return stringify2(this.toUUIDBytes());
  }
  toString() {
    if (this.prefix === "") {
      return this.suffix;
    }
    return `${this.prefix}_${this.suffix}`;
  }
  static fromString(str, prefix) {
    const typeIdRaw = fromString(str, prefix);
    return new TypeID(getType(typeIdRaw), getSuffix(typeIdRaw));
  }
  static fromUUIDBytes(prefix, bytes) {
    const suffix = encode(bytes);
    return new TypeID(prefix, suffix);
  }
  static fromUUID(prefix, uuid) {
    const suffix = encode(parseUUID(uuid));
    return new TypeID(prefix, suffix);
  }
};
function typeid(prefix = "", suffix = "") {
  return new TypeID(prefix, suffix);
}
export {
  TypeID,
  fromString,
  fromUUID,
  fromUUIDBytes,
  getSuffix,
  getType,
  parseTypeId,
  toUUID,
  toUUIDBytes,
  typeid,
  typeidUnboxed
};
//# sourceMappingURL=index.mjs.map