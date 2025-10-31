import * as protocol from '@arcjet/protocol';
import { ArcjetErrorDecision, ArcjetErrorReason, ArcjetRuleResult, ArcjetReason, ArcjetDenyDecision, ArcjetBotReason, ArcjetRateLimitReason, ArcjetEmailReason, ArcjetShieldReason, ArcjetSensitiveInfoReason, ArcjetFilterReason } from '@arcjet/protocol';
export * from '@arcjet/protocol';
import * as analyze from '@arcjet/analyze';
import * as duration from '@arcjet/duration';
import { ArcjetHeaders } from '@arcjet/headers';
import { runtime } from '@arcjet/runtime';
import * as hasher from '@arcjet/stable-hash';
import { MemoryCache } from '@arcjet/cache';

function assert(condition, msg) {
    if (!condition) {
        throw new Error(msg);
    }
}
function errorMessage(err) {
    if (err) {
        if (typeof err === "string") {
            return err;
        }
        if (typeof err === "object" &&
            "message" in err &&
            typeof err.message === "string") {
            return err.message;
        }
    }
    return "Unknown problem";
}
const knownFields = [
    "ip",
    "method",
    "protocol",
    "host",
    "path",
    "headers",
    "body",
    "email",
    "cookies",
    "query",
];
function isUnknownRequestProperty(key) {
    return !knownFields.includes(key);
}
function isEmailType(type) {
    return (type === "FREE" ||
        type === "DISPOSABLE" ||
        type === "NO_MX_RECORDS" ||
        type === "NO_GRAVATAR" ||
        type === "INVALID");
}
class Performance {
    log;
    constructor(logger) {
        this.log = logger;
    }
    // TODO(#2020): We should no-op this if loglevel is not `debug` to do less work
    measure(label) {
        const start = performance.now();
        return () => {
            const end = performance.now();
            const diff = end - start;
            this.log.debug("LATENCY %s: %sms", label, diff.toFixed(3));
        };
    }
}
function toString(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return `${value}`;
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    return "<unsupported value>";
}
// This is the Symbol that Vercel defines in their infrastructure to access the
// Context (where available). The Context can contain the `waitUntil` function.
// https://github.com/vercel/vercel/blob/930d7fb892dc26f240f2b950d963931c45e1e661/packages/functions/src/get-context.ts#L6
const SYMBOL_FOR_REQ_CONTEXT = Symbol.for("@vercel/request-context");
function lookupWaitUntil() {
    const fromSymbol = globalThis;
    if (typeof fromSymbol[SYMBOL_FOR_REQ_CONTEXT] === "object" &&
        fromSymbol[SYMBOL_FOR_REQ_CONTEXT] !== null &&
        "get" in fromSymbol[SYMBOL_FOR_REQ_CONTEXT] &&
        typeof fromSymbol[SYMBOL_FOR_REQ_CONTEXT].get === "function") {
        const vercelCtx = fromSymbol[SYMBOL_FOR_REQ_CONTEXT].get();
        if (typeof vercelCtx === "object" &&
            vercelCtx !== null &&
            "waitUntil" in vercelCtx &&
            typeof vercelCtx.waitUntil === "function") {
            return vercelCtx.waitUntil;
        }
    }
}
function toAnalyzeRequest(request) {
    const headers = {};
    if (typeof request.headers !== "undefined") {
        for (const [key, value] of request.headers.entries()) {
            headers[key] = value;
        }
    }
    return {
        ...request,
        headers,
    };
}
function extraProps(details) {
    const extra = new Map();
    for (const [key, value] of Object.entries(details)) {
        if (isUnknownRequestProperty(key)) {
            extra.set(key, toString(value));
        }
    }
    return Object.fromEntries(extra.entries());
}
function createTypeValidator(...types) {
    return (key, value) => {
        const typeOfValue = typeof value;
        if (!types.includes(typeOfValue)) {
            if (types.length === 1) {
                throw new Error(`invalid type for \`${key}\` - expected ${types[0]}`);
            }
            else {
                throw new Error(`invalid type for \`${key}\` - expected one of ${types.join(", ")}`);
            }
        }
        else {
            return false;
        }
    };
}
function createValueValidator(
// This uses types to ensure we have at least 2 values
...values) {
    return (key, value) => {
        // We cast the values to unknown because the optionValue isn't known but
        // we only want to use `values` on string enumerations
        if (!values.includes(value)) {
            throw new Error(`invalid value for \`${key}\` - expected one of ${values.map((value) => `'${value}'`).join(", ")}`);
        }
    };
}
function createArrayValidator(validate) {
    return (key, value) => {
        if (Array.isArray(value)) {
            for (const [idx, item] of value.entries()) {
                validate(`${key}[${idx}]`, item);
            }
        }
        else {
            throw new Error(`invalid type for \`${key}\` - expected an array`);
        }
    };
}
function createValidator({ rule, validations, }) {
    return (options) => {
        for (const { key, validate, required } of validations) {
            if (required && !Object.hasOwn(options, key)) {
                throw new Error(`\`${rule}\` options error: \`${key}\` is required`);
            }
            const value = options[key];
            // The `required` flag is checked above, so these should only be validated
            // if the value is not undefined.
            if (typeof value !== "undefined") {
                try {
                    validate(key, value);
                }
                catch (err) {
                    throw new Error(`\`${rule}\` options error: ${errorMessage(err)}`);
                }
            }
        }
    };
}
const validateString = createTypeValidator("string");
const validateNumber = createTypeValidator("number");
const validateBoolean = createTypeValidator("boolean");
const validateFunction = createTypeValidator("function");
const validateStringOrNumber = createTypeValidator("string", "number");
const validateStringArray = createArrayValidator(validateString);
const validateMode = createValueValidator("LIVE", "DRY_RUN");
const validateEmailTypes = createArrayValidator(createValueValidator("DISPOSABLE", "FREE", "NO_MX_RECORDS", "NO_GRAVATAR", "INVALID"));
const validateTokenBucketOptions = createValidator({
    rule: "tokenBucket",
    validations: [
        {
            key: "mode",
            required: false,
            validate: validateMode,
        },
        {
            key: "characteristics",
            validate: validateStringArray,
            required: false,
        },
        { key: "refillRate", required: true, validate: validateNumber },
        { key: "interval", required: true, validate: validateStringOrNumber },
        { key: "capacity", required: true, validate: validateNumber },
    ],
});
const validateFixedWindowOptions = createValidator({
    rule: "fixedWindow",
    validations: [
        { key: "mode", required: false, validate: validateMode },
        {
            key: "characteristics",
            validate: validateStringArray,
            required: false,
        },
        { key: "max", required: true, validate: validateNumber },
        { key: "window", required: true, validate: validateStringOrNumber },
    ],
});
const validateSlidingWindowOptions = createValidator({
    rule: "slidingWindow",
    validations: [
        { key: "mode", required: false, validate: validateMode },
        {
            key: "characteristics",
            validate: validateStringArray,
            required: false,
        },
        { key: "max", required: true, validate: validateNumber },
        { key: "interval", required: true, validate: validateStringOrNumber },
    ],
});
const validateSensitiveInfoOptions = createValidator({
    rule: "sensitiveInfo",
    validations: [
        { key: "mode", required: false, validate: validateMode },
        { key: "allow", required: false, validate: validateStringArray },
        { key: "deny", required: false, validate: validateStringArray },
        { key: "contextWindowSize", required: false, validate: validateNumber },
        { key: "detect", required: false, validate: validateFunction },
    ],
});
const validateEmailOptions = createValidator({
    rule: "validateEmail",
    validations: [
        { key: "mode", required: false, validate: validateMode },
        { key: "block", required: false, validate: validateEmailTypes },
        { key: "allow", required: false, validate: validateEmailTypes },
        { key: "deny", required: false, validate: validateEmailTypes },
        {
            key: "requireTopLevelDomain",
            required: false,
            validate: validateBoolean,
        },
        { key: "allowDomainLiteral", required: false, validate: validateBoolean },
    ],
});
const validateBotOptions = createValidator({
    rule: "detectBot",
    validations: [
        { key: "mode", required: false, validate: validateMode },
        { key: "allow", required: false, validate: validateStringArray },
        { key: "deny", required: false, validate: validateStringArray },
    ],
});
const validateShieldOptions = createValidator({
    rule: "shield",
    validations: [{ key: "mode", required: false, validate: validateMode }],
});
/**
 * Validate filter options.
 */
const validateFilterOptions = createValidator({
    rule: "filter",
    validations: [
        { key: "allow", required: false, validate: validateStringArray },
        { key: "deny", required: false, validate: validateStringArray },
        { key: "mode", required: false, validate: validateMode },
    ],
});
const Priority = {
    SensitiveInfo: 1,
    Filter: 2,
    Shield: 3,
    RateLimit: 4,
    BotDetection: 5,
    EmailValidation: 6,
};
function isRateLimitRule(rule) {
    return rule.type === "RATE_LIMIT";
}
/**
 * Arcjet token bucket rate limiting rule.
 *
 * Applying this rule sets a token bucket rate limit.
 *
 * This algorithm is based on a bucket filled with a specific number of tokens.
 * Each request withdraws some amount of tokens from the bucket and the bucket
 * is refilled at a fixed rate.
 * Once the bucket is empty, the client is blocked until the bucket refills.
 *
 * This algorithm is useful when you want to allow clients to make a burst of
 * requests and then still be able to make requests at a slower rate.
 *
 * @template Characteristics
 *   Characteristics to track a user by.
 * @param options
 *   Configuration for the token bucket rate limiting rule (required).
 * @returns
 *   Token bucket rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   ```ts
 *   tokenBucket({
 *     mode: "LIVE",
 *     refillRate: 10,
 *     interval: "60s",
 *     capacity: 100,
 *   });
 *   ```
 * @example
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       tokenBucket({
 *         mode: "LIVE",
 *         refillRate: 10,
 *         interval: "60s",
 *         capacity: 100,
 *       }),
 *     ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/rate-limiting/concepts
 * @link https://docs.arcjet.com/rate-limiting/algorithms#token-bucket
 * @link https://docs.arcjet.com/rate-limiting/reference
 */
function tokenBucket(options) {
    validateTokenBucketOptions(options);
    const type = "RATE_LIMIT";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const characteristics = Array.isArray(options.characteristics)
        ? options.characteristics
        : undefined;
    const refillRate = options.refillRate;
    const interval = duration.parse(options.interval);
    const capacity = options.capacity;
    const rule = {
        type,
        version,
        priority: Priority.RateLimit,
        mode,
        characteristics,
        algorithm: "TOKEN_BUCKET",
        refillRate,
        interval,
        capacity,
        validate() { },
        async protect(context, details) {
            const localCharacteristics = characteristics ?? context.characteristics;
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.string("algorithm", "TOKEN_BUCKET"), hasher.stringSliceOrdered("characteristics", localCharacteristics), 
            // Match is deprecated so it is always an empty string in the newest SDKs
            hasher.string("match", ""), hasher.uint32("refillRate", refillRate), hasher.uint32("interval", interval), hasher.uint32("capacity", capacity));
            const analyzeContext = {
                characteristics: localCharacteristics,
                log: context.log,
            };
            const fingerprint = await analyze.generateFingerprint(analyzeContext, toAnalyzeRequest(details));
            const [cached, ttl] = await context.cache.get(ruleId, fingerprint);
            if (cached && cached.reason.isRateLimit()) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl,
                    state: "CACHED",
                    conclusion: cached.conclusion,
                    // We rebuild the `ArcjetRateLimitReason` because we need to adjust
                    // the `reset` based on the current time-to-live
                    reason: new ArcjetRateLimitReason({
                        max: cached.reason.max,
                        remaining: cached.reason.remaining,
                        reset: ttl,
                        window: cached.reason.window,
                        resetTime: cached.reason.resetTime,
                    }),
                });
            }
            return new ArcjetRuleResult({
                ruleId,
                fingerprint,
                ttl: 0,
                state: "NOT_RUN",
                conclusion: "ALLOW",
                reason: new ArcjetRateLimitReason({
                    max: 0,
                    remaining: 0,
                    reset: 0,
                    window: 0,
                    resetTime: new Date(),
                }),
            });
        },
    };
    return [rule];
}
/**
 * Arcjet fixed window rate limiting rule.
 *
 * Applying this rule sets a fixed window rate limit which tracks the number of
 * requests made by a client over a fixed time window.
 *
 * This is the simplest algorithm.
 * It tracks the number of requests made by a client over a fixed time window
 * such as 60 seconds.
 * If the client exceeds the limit, they are blocked until the window expires.
 *
 * This algorithm is useful when you want to apply a simple fixed limit in a
 * fixed time window.
 * For example, a simple limit on the total number of requests a client can make.
 * However, it can be susceptible to the stampede problem where a client makes
 * a burst of requests at the start of a window and then is blocked for the rest
 * of the window.
 * The sliding window algorithm can be used to avoid this.
 *
 * @template Characteristics
 *   Characteristics to track a user by.
 * @param options
 *   Configuration for the fixed window rate limiting rule (required).
 * @returns
 *   Fixed window rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   ```ts
 *   fixedWindow({ mode: "LIVE", window: "60s", max: 100 });
 *   ```
 * @example
 *   ```ts
 *   const aj = arcjet({
 *      key: process.env.ARCJET_KEY,
 *     rules: [
 *       fixedWindow({
 *         mode: "LIVE",
 *         window: "60s",
 *         max: 100,
 *       })
 *     ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/rate-limiting/concepts
 * @link https://docs.arcjet.com/rate-limiting/algorithms#fixed-window
 * @link https://docs.arcjet.com/rate-limiting/reference
 */
function fixedWindow(options) {
    validateFixedWindowOptions(options);
    const type = "RATE_LIMIT";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const characteristics = Array.isArray(options.characteristics)
        ? options.characteristics
        : undefined;
    const max = options.max;
    const window = duration.parse(options.window);
    const rule = {
        type,
        version,
        priority: Priority.RateLimit,
        mode,
        characteristics,
        algorithm: "FIXED_WINDOW",
        max,
        window,
        validate() { },
        async protect(context, details) {
            const localCharacteristics = characteristics ?? context.characteristics;
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.string("algorithm", "FIXED_WINDOW"), hasher.stringSliceOrdered("characteristics", localCharacteristics), 
            // Match is deprecated so it is always an empty string in the newest SDKs
            hasher.string("match", ""), hasher.uint32("max", max), hasher.uint32("window", window));
            const analyzeContext = {
                characteristics: localCharacteristics,
                log: context.log,
            };
            const fingerprint = await analyze.generateFingerprint(analyzeContext, toAnalyzeRequest(details));
            const [cached, ttl] = await context.cache.get(ruleId, fingerprint);
            if (cached && cached.reason.isRateLimit()) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl,
                    state: "CACHED",
                    conclusion: cached.conclusion,
                    // We rebuild the `ArcjetRateLimitReason` because we need to adjust
                    // the `reset` based on the current time-to-live
                    reason: new ArcjetRateLimitReason({
                        max: cached.reason.max,
                        remaining: cached.reason.remaining,
                        reset: ttl,
                        window: cached.reason.window,
                        resetTime: cached.reason.resetTime,
                    }),
                });
            }
            return new ArcjetRuleResult({
                ruleId,
                fingerprint,
                ttl: 0,
                state: "NOT_RUN",
                conclusion: "ALLOW",
                reason: new ArcjetRateLimitReason({
                    max: 0,
                    remaining: 0,
                    reset: 0,
                    window: 0,
                }),
            });
        },
    };
    return [rule];
}
/**
 * Arcjet sliding window rate limiting rule.
 *
 * Applying this rule sets a sliding window rate limit which tracks the number
 * of requests made by a client over a sliding window so that the window moves
 * with time.
 *
 * This algorithm is useful to avoid the stampede problem of the fixed window.
 * It provides smoother rate limiting over time and can prevent a client from
 * making a burst of requests at the start of a window and then being blocked
 * for the rest of the window.
 *
 * @template Characteristics
 *   Characteristics to track a user by.
 * @param options
 *   Configuration for the sliding window rate limiting rule (required).
 * @returns
 *   Token bucket rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   ```ts
 *   slidingWindow({ mode: "LIVE", interval: "60s", max: 100 });
 *   ```
 * @example
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       slidingWindow({
 *         mode: "LIVE",
 *         interval: "60s",
 *         max: 100,
 *       })
 *     ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/rate-limiting/concepts
 * @link https://docs.arcjet.com/rate-limiting/algorithms#sliding-window
 * @link https://docs.arcjet.com/rate-limiting/reference
 */
function slidingWindow(options) {
    validateSlidingWindowOptions(options);
    const type = "RATE_LIMIT";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const characteristics = Array.isArray(options.characteristics)
        ? options.characteristics
        : undefined;
    const max = options.max;
    const interval = duration.parse(options.interval);
    const rule = {
        type,
        version,
        priority: Priority.RateLimit,
        mode,
        characteristics,
        algorithm: "SLIDING_WINDOW",
        max,
        interval,
        validate() { },
        async protect(context, details) {
            const localCharacteristics = characteristics ?? context.characteristics;
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.string("algorithm", "SLIDING_WINDOW"), hasher.stringSliceOrdered("characteristics", localCharacteristics), 
            // Match is deprecated so it is always an empty string in the newest SDKs
            hasher.string("match", ""), hasher.uint32("max", max), hasher.uint32("interval", interval));
            const analyzeContext = {
                characteristics: localCharacteristics,
                log: context.log,
            };
            const fingerprint = await analyze.generateFingerprint(analyzeContext, toAnalyzeRequest(details));
            const [cached, ttl] = await context.cache.get(ruleId, fingerprint);
            if (cached && cached.reason.isRateLimit()) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl,
                    state: "CACHED",
                    conclusion: cached.conclusion,
                    // We rebuild the `ArcjetRateLimitReason` because we need to adjust
                    // the `reset` based on the current time-to-live
                    reason: new ArcjetRateLimitReason({
                        max: cached.reason.max,
                        remaining: cached.reason.remaining,
                        reset: ttl,
                        window: cached.reason.window,
                        resetTime: cached.reason.resetTime,
                    }),
                });
            }
            return new ArcjetRuleResult({
                ruleId,
                fingerprint,
                ttl: 0,
                state: "NOT_RUN",
                conclusion: "ALLOW",
                reason: new ArcjetRateLimitReason({
                    max: 0,
                    remaining: 0,
                    reset: 0,
                    window: 0,
                }),
            });
        },
    };
    return [rule];
}
function protocolSensitiveInfoEntitiesToAnalyze(entity) {
    if (typeof entity !== "string") {
        throw new Error("invalid entity type");
    }
    if (entity === "EMAIL") {
        return { tag: "email" };
    }
    if (entity === "PHONE_NUMBER") {
        return { tag: "phone-number" };
    }
    if (entity === "IP_ADDRESS") {
        return { tag: "ip-address" };
    }
    if (entity === "CREDIT_CARD_NUMBER") {
        return { tag: "credit-card-number" };
    }
    return {
        tag: "custom",
        val: entity,
    };
}
function analyzeSensitiveInfoEntitiesToString(entity) {
    if (entity.tag === "email") {
        return "EMAIL";
    }
    if (entity.tag === "ip-address") {
        return "IP_ADDRESS";
    }
    if (entity.tag === "credit-card-number") {
        return "CREDIT_CARD_NUMBER";
    }
    if (entity.tag === "phone-number") {
        return "PHONE_NUMBER";
    }
    return entity.val;
}
function convertAnalyzeDetectedSensitiveInfoEntity(detectedEntities) {
    return detectedEntities.map((detectedEntity) => {
        return {
            ...detectedEntity,
            identifiedType: analyzeSensitiveInfoEntitiesToString(detectedEntity.identifiedType),
        };
    });
}
/**
 * Arcjet sensitive information detection rule.
 *
 * Applying this rule protects against clients sending you sensitive information
 * such as personally identifiable information (PII) that you do not wish to
 * handle.
 * The rule runs entirely locally so no data ever leaves your environment.
 *
 * This rule includes built-in detections for email addresses, credit/debit card
 * numbers, IP addresses, and phone numbers.
 * You can also provide a custom detection function to identify additional
 * sensitive information.
 *
 * @template Detect
 *   Custom detection function to identify sensitive information.
 * @template CustomEntities
 *   Custom entities.
 * @param options
 *   Configuration for the sensitive information detection rule (required).
 * @returns
 *   Sensitive information rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   ```ts
 *   sensitiveInfo({ mode: "LIVE", deny: ["EMAIL"] });
 *   ```
 * @example
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       sensitiveInfo({
 *         mode: "LIVE",
 *         deny: ["EMAIL"],
 *       })
 *     ],
 *   });
 *   ```
 * @example
 *   Custom detection function:
 *
 *   ```ts
 *   function detectDash(tokens: string[]): Array<"CONTAINS_DASH" | undefined> {
 *     return tokens.map((token) => {
 *       if (token.includes("-")) {
 *         return "CONTAINS_DASH";
 *       }
 *     });
 *   }
 *
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       sensitiveInfo({
 *         mode: "LIVE",
 *         deny: ["EMAIL", "CONTAINS_DASH"],
 *         detect: detectDash,
 *         contextWindowSize: 2,
 *       })
 *     ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/sensitive-info/concepts
 * @link https://docs.arcjet.com/sensitive-info/reference
 */
function sensitiveInfo(options) {
    validateSensitiveInfoOptions(options);
    if (typeof options.allow !== "undefined" &&
        typeof options.deny !== "undefined") {
        throw new Error("`sensitiveInfo` options error: `allow` and `deny` cannot be provided together");
    }
    if (typeof options.allow === "undefined" &&
        typeof options.deny === "undefined") {
        throw new Error("`sensitiveInfo` options error: either `allow` or `deny` must be specified");
    }
    const type = "SENSITIVE_INFO";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const allow = options.allow || [];
    const deny = options.deny || [];
    const rule = {
        version,
        priority: Priority.SensitiveInfo,
        type,
        mode,
        allow,
        deny,
        validate(context, details) { },
        async protect(context, details) {
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.stringSliceOrdered("allow", allow), hasher.stringSliceOrdered("deny", deny));
            const { fingerprint } = context;
            // No cache is implemented here because the fingerprint can be the same
            // while the request body changes. This is also why the `sensitiveInfo`
            // rule results always have a `ttl` of 0.
            const body = await context.getBody();
            if (typeof body === "undefined") {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 0,
                    state: "NOT_RUN",
                    conclusion: "ERROR",
                    reason: new ArcjetErrorReason("Couldn't read the body of the request to perform sensitive info identification."),
                });
            }
            let convertedDetect = undefined;
            if (typeof options.detect !== "undefined") {
                const detect = options.detect;
                convertedDetect = (tokens) => {
                    return detect(tokens)
                        .filter((e) => typeof e !== "undefined")
                        .map(protocolSensitiveInfoEntitiesToAnalyze);
                };
            }
            let entitiesTag = "allow";
            let entitiesVal = [];
            if (Array.isArray(options.allow)) {
                entitiesTag = "allow";
                entitiesVal = options.allow
                    .filter((e) => typeof e !== "undefined")
                    .map(protocolSensitiveInfoEntitiesToAnalyze);
            }
            if (Array.isArray(options.deny)) {
                entitiesTag = "deny";
                entitiesVal = options.deny
                    .filter((e) => typeof e !== "undefined")
                    .map(protocolSensitiveInfoEntitiesToAnalyze);
            }
            const entities = {
                tag: entitiesTag,
                val: entitiesVal,
            };
            const result = await analyze.detectSensitiveInfo(context, body, entities, options.contextWindowSize || 1, convertedDetect);
            const state = mode === "LIVE" ? "RUN" : "DRY_RUN";
            const reason = new ArcjetSensitiveInfoReason({
                denied: convertAnalyzeDetectedSensitiveInfoEntity(result.denied),
                allowed: convertAnalyzeDetectedSensitiveInfoEntity(result.allowed),
            });
            if (result.denied.length === 0) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 0,
                    state,
                    conclusion: "ALLOW",
                    reason,
                });
            }
            else {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 0,
                    state,
                    conclusion: "DENY",
                    reason,
                });
            }
        },
    };
    return [rule];
}
/**
 * Arcjet email validation rule.
 *
 * Applying this rule allows you to validate and verify an email address.
 *
 * The first step of the analysis is to validate the email address syntax.
 * This runs locally within the SDK and validates the email address is in the
 * correct format.
 * If the email syntax is valid, the SDK will pass the email address to the
 * Arcjet cloud API to verify the email address.
 * This performs several checks, depending on the rule configuration.
 *
 * @param options
 *   Configuration for the email validation rule (required).
 * @returns
 *   Email rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   ```ts
 *   validateEmail({ mode: "LIVE", deny: ["DISPOSABLE", "INVALID"] });
 *   ```
 * @example
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       validateEmail({
 *         mode: "LIVE",
 *         deny: ["DISPOSABLE", "INVALID"]
 *       })
 *     ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/email-validation/concepts
 * @link https://docs.arcjet.com/email-validation/reference
 */
function validateEmail(options) {
    validateEmailOptions(options);
    if (typeof options.allow !== "undefined" &&
        typeof options.deny !== "undefined") {
        throw new Error("`validateEmail` options error: `allow` and `deny` cannot be provided together");
    }
    if (typeof options.allow !== "undefined" &&
        typeof options.block !== "undefined") {
        throw new Error("`validateEmail` options error: `allow` and `block` cannot be provided together");
    }
    if (typeof options.deny !== "undefined" &&
        typeof options.block !== "undefined") {
        throw new Error("`validateEmail` options error: `deny` and `block` cannot be provided together, `block` is now deprecated so `deny` should be preferred.");
    }
    if (typeof options.allow === "undefined" &&
        typeof options.deny === "undefined" &&
        typeof options.block === "undefined") {
        throw new Error("`validateEmail` options error: either `allow` or `deny` must be specified");
    }
    const type = "EMAIL";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const allow = options.allow ?? [];
    const deny = options.deny ?? options.block ?? [];
    const requireTopLevelDomain = options.requireTopLevelDomain ?? true;
    const allowDomainLiteral = options.allowDomainLiteral ?? false;
    let config = {
        tag: "deny-email-validation-config",
        val: {
            requireTopLevelDomain,
            allowDomainLiteral,
            deny: [],
        },
    };
    if (typeof options.allow !== "undefined") {
        config = {
            tag: "allow-email-validation-config",
            val: {
                requireTopLevelDomain,
                allowDomainLiteral,
                allow: options.allow,
            },
        };
    }
    if (typeof options.deny !== "undefined") {
        config = {
            tag: "deny-email-validation-config",
            val: {
                requireTopLevelDomain,
                allowDomainLiteral,
                deny: options.deny,
            },
        };
    }
    if (typeof options.block !== "undefined") {
        config = {
            tag: "deny-email-validation-config",
            val: {
                requireTopLevelDomain,
                allowDomainLiteral,
                deny: options.block,
            },
        };
    }
    const rule = {
        version,
        priority: Priority.EmailValidation,
        type,
        mode,
        allow,
        deny,
        requireTopLevelDomain,
        allowDomainLiteral,
        validate(context, details) {
            assert(typeof details.email !== "undefined", "ValidateEmail requires `email` to be set.");
        },
        async protect(context, { email }) {
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.stringSliceOrdered("allow", allow), hasher.stringSliceOrdered("deny", deny), hasher.bool("requireTopLevelDomain", requireTopLevelDomain), hasher.bool("allowDomainLiteral", allowDomainLiteral));
            const { fingerprint } = context;
            // No cache is implemented here because the fingerprint can be the same
            // while the email changes. This is also why the `email` rule results
            // always have a `ttl` of 0.
            const result = await analyze.isValidEmail(context, email, config);
            const state = mode === "LIVE" ? "RUN" : "DRY_RUN";
            if (result.validity === "valid") {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 0,
                    state,
                    conclusion: "ALLOW",
                    reason: new ArcjetEmailReason({ emailTypes: [] }),
                });
            }
            else {
                const typedEmailTypes = result.blocked.filter(isEmailType);
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 0,
                    state,
                    conclusion: "DENY",
                    reason: new ArcjetEmailReason({
                        emailTypes: typedEmailTypes,
                    }),
                });
            }
        },
    };
    return [rule];
}
/**
 * Arcjet bot detection rule.
 *
 * Applying this rule allows you to manage traffic by automated clients and
 * bots.
 *
 * Bots can be good (such as search engine crawlers or monitoring agents) or bad
 * (such as scrapers or automated scripts).
 * Arcjet allows you to configure which bots you want to allow or deny by
 * specific bot names such as curl, as well as by category such as search
 * engine bots.
 *
 * Bots are detected based on various signals such as the user agent, IP
 * address, DNS records, and more.
 *
 * @param options
 *   Configuration for the bot rule (required).
 * @returns
 *   Bot rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   Allow search engine bots and curl, deny all other bots:
 *
 *   ```ts
 *   detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE", "CURL"] });
 *   ```
 * @example
 *   Allow search engine bots and curl, deny all other bots:
 *
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       detectBot({
 *         mode: "LIVE",
 *         allow: ["CATEGORY:SEARCH_ENGINE", "CURL"]
 *       })
 *     ],
 *   });
 *   ```
 * @example
 *   Deny AI crawlers, allow all other bots:
 *
 *   ```ts
 *   detectBot({ mode: "LIVE", deny: ["CATEGORY:AI"] });
 *   ```
 * @example
 *   Deny AI crawlers, allows all other bots:
 *
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *       detectBot({
 *         mode: "LIVE",
 *         deny: ["CATEGORY:AI"]
 *       })
 *     ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/bot-protection/concepts
 * @link https://docs.arcjet.com/bot-protection/identifying-bots
 * @link https://docs.arcjet.com/bot-protection/reference
 */
function detectBot(options) {
    validateBotOptions(options);
    if (typeof options.allow !== "undefined" &&
        typeof options.deny !== "undefined") {
        throw new Error("`detectBot` options error: `allow` and `deny` cannot be provided together");
    }
    if (typeof options.allow === "undefined" &&
        typeof options.deny === "undefined") {
        throw new Error("`detectBot` options error: either `allow` or `deny` must be specified");
    }
    const type = "BOT";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const allow = options.allow ?? [];
    const deny = options.deny ?? [];
    let config = {
        tag: "allowed-bot-config",
        val: {
            entities: [],
            skipCustomDetect: true,
        },
    };
    if (typeof options.allow !== "undefined") {
        config = {
            tag: "allowed-bot-config",
            val: {
                entities: options.allow,
                skipCustomDetect: true,
            },
        };
    }
    if (typeof options.deny !== "undefined") {
        config = {
            tag: "denied-bot-config",
            val: {
                entities: options.deny,
                skipCustomDetect: true,
            },
        };
    }
    const rule = {
        version,
        priority: Priority.BotDetection,
        type,
        mode,
        allow,
        deny,
        validate(context, details) {
            if (typeof details.headers === "undefined") {
                throw new Error("bot detection requires `headers` to be set");
            }
            if (typeof details.headers.has !== "function") {
                throw new Error("bot detection requires `headers` to extend `Headers`");
            }
            if (!details.headers.has("user-agent")) {
                throw new Error("bot detection requires user-agent header");
            }
        },
        /**
         * Attempts to call the bot detection on the headers.
         */
        async protect(context, request) {
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.stringSliceOrdered("allow", allow), hasher.stringSliceOrdered("deny", deny));
            const { fingerprint } = context;
            const [cached, ttl] = await context.cache.get(ruleId, fingerprint);
            if (cached) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl,
                    state: "CACHED",
                    conclusion: cached.conclusion,
                    reason: cached.reason,
                });
            }
            const result = await analyze.detectBot(context, toAnalyzeRequest(request), config);
            const state = mode === "LIVE" ? "RUN" : "DRY_RUN";
            // If this is a bot and of a type that we want to block, then block!
            if (result.denied.length > 0) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 60,
                    state,
                    conclusion: "DENY",
                    reason: new ArcjetBotReason({
                        allowed: result.allowed,
                        denied: result.denied,
                        verified: result.verified,
                        spoofed: result.spoofed,
                    }),
                });
            }
            else {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl: 0,
                    state,
                    conclusion: "ALLOW",
                    reason: new ArcjetBotReason({
                        allowed: result.allowed,
                        denied: result.denied,
                        verified: result.verified,
                        spoofed: result.spoofed,
                    }),
                });
            }
        },
    };
    return [rule];
}
/**
 * Arcjet Shield WAF rule.
 *
 * Applying this rule protects your application against common attacks,
 * including the OWASP Top 10.
 *
 * The Arcjet Shield WAF analyzes every request to your application to detect
 * suspicious activity.
 * Once a certain suspicion threshold is reached,
 * subsequent requests from that client are blocked for a period of time.
 *
 * @param options
 *   Configuration for the Shield rule.
 * @returns
 *   Shield rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   ```ts
 *   shield({ mode: "LIVE" });
 *   ```
 * @example
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [shield({ mode: "LIVE" })],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/shield/concepts
 * @link https://docs.arcjet.com/shield/reference
 */
function shield(options) {
    validateShieldOptions(options);
    const type = "SHIELD";
    const version = 0;
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const rule = {
        type,
        version,
        priority: Priority.Shield,
        mode,
        validate() { },
        async protect(context, details) {
            // TODO(#1989): Prefer characteristics defined on rule once available
            const localCharacteristics = context.characteristics;
            const ruleId = await hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.stringSliceOrdered("characteristics", localCharacteristics));
            const analyzeContext = {
                characteristics: localCharacteristics,
                log: context.log,
            };
            const fingerprint = await analyze.generateFingerprint(analyzeContext, toAnalyzeRequest(details));
            const [cached, ttl] = await context.cache.get(ruleId, fingerprint);
            if (cached) {
                return new ArcjetRuleResult({
                    ruleId,
                    fingerprint,
                    ttl,
                    state: "CACHED",
                    conclusion: cached.conclusion,
                    reason: cached.reason,
                });
            }
            return new ArcjetRuleResult({
                ruleId,
                fingerprint,
                ttl: 0,
                state: "NOT_RUN",
                conclusion: "ALLOW",
                reason: new ArcjetShieldReason({
                    shieldTriggered: false,
                }),
            });
        },
    };
    return [rule];
}
/**
 * Arcjet signup form protection rule.
 *
 * Applying this rule combines rate limiting, bot protection, and email
 * validation to protect your signup forms from abuse.
 * Using this rule will configure the following:
 *
 * - Rate limiting - signup forms are a common target for bots. Arcjet’s rate
 *   limiting helps to prevent bots and other automated or malicious clients
 *   from submitting your signup form too many times in a short period of time.
 * - Bot protection - signup forms are usually exclusively used by humans, which
 *   means that any automated submissions to the form are likely to be
 *   fraudulent.
 * - Email validation - email addresses should be validated to ensure the signup
 *   is coming from a legitimate user with a real email address that can
 *   actually receive messages.
 *
 * @template Characteristics
 *   Characteristics to track a user by.
 * @param options
 *   Configuration for the signup form protection rule.
 * @returns
 *   Signup form protection rule to provide to the SDK in the `rules` field.
 *
 * @example
 *   Our recommended configuration for most signup forms is:
 *
 *   - Block email addresses with invalid syntax, that are from disposable email providers,
 *     or do not have valid MX records configured.
 *   - Block all bots.
 *   - Apply a rate limit of 5 submissions per 10 minutes from a single IP
 *     address.
 *
 *   ```ts
 *   const aj = arcjet({
 *     key: process.env.ARCJET_KEY,
 *     rules: [
 *      protectSignup({
 *        email: {
 *          mode: "LIVE",
 *          block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
 *        },
 *        bots: {
 *          mode: "LIVE",
 *          allow: [], // block all detected bots
 *        },
 *        rateLimit: {
 *          mode: "LIVE",
 *          interval: "10m",
 *          max: 5,
 *        },
 *      }),
 *    ],
 *   });
 *   ```
 *
 * @link https://docs.arcjet.com/signup-protection/concepts
 * @link https://docs.arcjet.com/signup-protection/reference
 */
function protectSignup(options) {
    return [
        ...slidingWindow(options.rateLimit),
        ...detectBot(options.bots),
        ...validateEmail(options.email),
    ];
}
/**
 * Arcjet filter rule.
 *
 * Applying this rule lets you block requests using Wireshark-like display
 * filter expressions over HTTP headers, IP addresses, and other request
 * fields.
 * You can quickly enforce rules like allow/deny by country, network, or
 * `user-agent` pattern.
 *
 * See the [reference guide](https://docs.arcjet.com/filters/reference) for
 * more info on the expression language fields, functions, and values.
 *
 * @param options
 *   Configuration (required).
 * @returns
 *   Filter rule.
 *
 * @example
 *   In this example, the expression matches non-VPN GET requests from the US.
 *   Requests matching the expression are allowed, all others are denied.
 *
 *   ```ts
 *   filter({
 *     allow: [
 *       'http.request.method eq "GET" and ip.src.country eq "US" and not ip.src.vpn',
 *     ],
 *     mode: "LIVE",
 *   })
 *   ```
 *
 * @link https://docs.arcjet.com/filters/reference
 */
function filter(options) {
    validateFilterOptions(options);
    const mode = options.mode === "LIVE" ? "LIVE" : "DRY_RUN";
    const allow = options.allow ?? [];
    const deny = options.deny ?? [];
    if (allow.length > 0 && deny.length > 0) {
        throw new Error("`filter` options error: expressions must be passed in either `allow` or `deny` instead of both");
    }
    if (allow.length === 0 && deny.length === 0) {
        throw new Error("`filter` options error: one or more expressions must be passed in `allow` or `deny`");
    }
    const state = mode === "LIVE" ? "RUN" : "DRY_RUN";
    const type = "FILTER";
    const version = 0;
    const ruleIdPromise = hasher.hash(hasher.string("type", type), hasher.uint32("version", version), hasher.string("mode", mode), hasher.stringSliceOrdered("allow", 
    // @ts-expect-error: `hasher` must support readonly values.
    allow), hasher.stringSliceOrdered("deny", 
    // @ts-expect-error: `hasher` must support readonly values.
    deny));
    const rule = {
        allow,
        deny,
        mode,
        priority: Priority.Filter,
        async protect(context, request) {
            const ruleId = await ruleIdPromise;
            const [cached, ttl] = await context.cache.get(ruleId, context.fingerprint);
            if (cached) {
                return new ArcjetRuleResult({
                    conclusion: cached.conclusion,
                    fingerprint: context.fingerprint,
                    reason: cached.reason,
                    ruleId,
                    state: "CACHED",
                    ttl,
                });
            }
            const request_ = toAnalyzeRequest(request);
            let ruleResult;
            try {
                const result = await analyze.matchFilters(context, request_, allow.length > 0 ? allow : deny, allow.length > 0);
                ruleResult = new ArcjetRuleResult({
                    conclusion: result.allowed ? "ALLOW" : "DENY",
                    fingerprint: context.fingerprint,
                    reason: new ArcjetFilterReason(result),
                    ruleId,
                    state,
                    ttl: result.allowed ? 0 : 60,
                });
            }
            catch (error) {
                ruleResult = new ArcjetRuleResult({
                    conclusion: "ERROR",
                    fingerprint: context.fingerprint,
                    reason: new ArcjetErrorReason(error),
                    ruleId,
                    state,
                    ttl: 0,
                });
            }
            return ruleResult;
        },
        type,
        validate() { },
        version,
    };
    return [rule];
}
/**
 * Create a new Arcjet instance.
 *
 * @template Rules
 *   List of rules.
 * @template Characteristics
 *   Characteristics to track a user by.
 * @param options
 *   Configuration.
 * @returns
 *   Arcjet instance.
 */
function arcjet(options) {
    // We destructure here to make the function signature neat when viewed by consumers
    const { key, rules } = options;
    const rt = runtime();
    // TODO: Separate the ArcjetOptions from the SDK Options
    // It is currently optional in the options so users can override it via an SDK
    if (typeof options.log === "undefined") {
        throw new Error("Log is required");
    }
    const log = options.log;
    const perf = new Performance(log);
    // TODO(#207): Remove this when we can default the transport so client is not required
    // It is currently optional in the options so the Next SDK can override it for the user
    if (typeof options.client === "undefined") {
        throw new Error("Client is required");
    }
    const client = options.client;
    // A local cache of block decisions. Might be emphemeral per request,
    // depending on the way the runtime works, but it's worth a try.
    // TODO(#132): Support configurable caching
    const cache = new MemoryCache();
    const rootRules = rules
        .flat(1)
        .sort((a, b) => a.priority - b.priority);
    async function protect(rules, ctx, request) {
        // This goes against the type definition above, but users might call
        // `protect()` with no value and we don't want to crash
        if (typeof request === "undefined") {
            request = {};
        }
        const details = Object.freeze({
            ip: request.ip,
            method: request.method,
            protocol: request.protocol,
            host: request.host,
            path: request.path,
            headers: new ArcjetHeaders(request.headers),
            cookies: request.cookies,
            query: request.query,
            extra: extraProps(request),
            email: typeof request.email === "string" ? request.email : undefined,
        });
        const characteristics = options.characteristics
            ? [...options.characteristics]
            : [];
        const waitUntil = lookupWaitUntil();
        const baseContext = {
            key,
            log,
            characteristics,
            waitUntil,
            ...ctx,
        };
        let fingerprint = "";
        const logFingerprintPerf = perf.measure("fingerprint");
        try {
            fingerprint = await analyze.generateFingerprint(baseContext, toAnalyzeRequest(details));
            log.debug("fingerprint (%s): %s", rt, fingerprint);
        }
        catch (error) {
            log.error({ error: errorMessage(error) }, "Failed to build fingerprint. Please verify your Characteristics.");
            const decision = new ArcjetErrorDecision({
                ttl: 0,
                reason: new ArcjetErrorReason(`Failed to build fingerprint - ${errorMessage(error)}`),
                // No results because we couldn't create a fingerprint
                results: [],
            });
            // TODO: Consider sending this to Report when we have an infallible fingerprint
            return decision;
        }
        finally {
            logFingerprintPerf();
        }
        const context = Object.freeze({
            ...baseContext,
            cache,
            fingerprint,
            runtime: rt,
        });
        if (rules.length < 1) {
            log.warn("Calling `protect()` with no rules is deprecated. Did you mean to configure the Shield rule?");
        }
        if (rules.length > 10) {
            log.error("Failure running rules. Only 10 rules may be specified.");
            const decision = new ArcjetErrorDecision({
                ttl: 0,
                reason: new ArcjetErrorReason("Only 10 rules may be specified"),
                // No results because the sorted rules were too long and we don't want
                // to instantiate a ton of NOT_RUN results
                results: [],
            });
            client.report(context, details, decision, 
            // No rules because we've determined they were too long and we don't
            // want to try to send them to the server
            []);
            return decision;
        }
        const results = [];
        for (let idx = 0; idx < rules.length; idx++) {
            // Default all rules to NOT_RUN/ALLOW before doing anything
            results[idx] = new ArcjetRuleResult({
                // TODO(#4030): Figure out if we can get each Rule ID before they are run
                ruleId: "",
                fingerprint,
                ttl: 0,
                state: "NOT_RUN",
                conclusion: "ALLOW",
                reason: new ArcjetReason(),
            });
            // Add top-level characteristics to all Rate Limit rules that don't already have
            // their own set of characteristics.
            const candidate_rule = rules[idx];
            if (isRateLimitRule(candidate_rule)) {
                if (typeof candidate_rule.characteristics === "undefined") {
                    candidate_rule.characteristics = characteristics;
                    rules[idx] = candidate_rule;
                }
            }
        }
        const logLocalPerf = perf.measure("local");
        try {
            for (const [idx, rule] of rules.entries()) {
                // This re-assignment is a workaround to a TypeScript error with
                // assertions where the name was introduced via a destructure
                const localRule = rule;
                const logRulePerf = perf.measure(rule.type);
                try {
                    if (typeof localRule.validate !== "function") {
                        throw new Error("rule must have a `validate` function");
                    }
                    localRule.validate(context, details);
                    if (typeof localRule.protect !== "function") {
                        throw new Error("rule must have a `protect` function");
                    }
                    results[idx] = await localRule.protect(context, details);
                    // If a rule didn't return a rule result, we need to stub it to avoid
                    // crashing. This should only happen if a user writes a custom local
                    // rule incorrectly.
                    if (typeof results[idx] === "undefined") {
                        results[idx] = new ArcjetRuleResult({
                            // TODO(#4030): If we can get the Rule ID before running rules,
                            // this can use it
                            ruleId: "",
                            fingerprint,
                            ttl: 0,
                            state: "RUN",
                            conclusion: "ERROR",
                            reason: new ArcjetErrorReason("rule result missing"),
                        });
                    }
                    log.debug({
                        id: results[idx].ruleId,
                        rule: rule.type,
                        fingerprint,
                        path: details.path,
                        runtime: rt,
                        ttl: results[idx].ttl,
                        conclusion: results[idx].conclusion,
                        reason: results[idx].reason,
                    }, "Local rule result:");
                }
                catch (err) {
                    log.error("Failure running rule: %s due to %s", rule.type, errorMessage(err));
                    results[idx] = new ArcjetRuleResult({
                        // TODO(#4030): Figure out if we can get a Rule ID in this error case
                        ruleId: "",
                        fingerprint,
                        ttl: 0,
                        state: "RUN",
                        conclusion: "ERROR",
                        reason: new ArcjetErrorReason(err),
                    });
                }
                finally {
                    logRulePerf();
                }
                const result = results[idx];
                if (result.isDenied()) {
                    // If the rule is not a DRY_RUN, we want to cache non-zero TTL results
                    // and return a DENY decision.
                    if (result.state !== "DRY_RUN") {
                        const decision = new ArcjetDenyDecision({
                            ttl: result.ttl,
                            reason: result.reason,
                            results,
                        });
                        // Only a DENY decision is reported to avoid creating 2 entries for
                        // a request. Upon ALLOW, the `decide` call will create an entry for
                        // the request.
                        client.report(context, details, decision, rules);
                        if (result.ttl > 0) {
                            log.debug({
                                fingerprint: result.fingerprint,
                                conclusion: result.conclusion,
                                reason: result.reason,
                            }, "Caching decision for %d seconds", decision.ttl);
                            cache.set(result.ruleId, result.fingerprint, {
                                conclusion: result.conclusion,
                                reason: result.reason,
                            }, result.ttl);
                        }
                        return decision;
                    }
                    log.warn(`Dry run mode is enabled for "%s" rule. Overriding decision. Decision was: DENY`, rule.type);
                }
            }
        }
        finally {
            logLocalPerf();
        }
        // With no cached values, we take a decision remotely. We use a timeout to
        // fail open.
        const logRemotePerf = perf.measure("remote");
        try {
            const logDediceApiPerf = perf.measure("decideApi");
            const decision = await client
                .decide(context, details, rules)
                .finally(() => {
                logDediceApiPerf();
            });
            // If the decision is to block and we have a non-zero TTL, we cache the
            // block locally
            if (decision.isDenied() && decision.ttl > 0) {
                log.debug("decide: Caching block locally for %d seconds", decision.ttl);
                for (const result of decision.results) {
                    // Cache all DENY results for local cache lookups
                    if (result.conclusion === "DENY") {
                        cache.set(result.ruleId, result.fingerprint, {
                            conclusion: result.conclusion,
                            reason: result.reason,
                        }, result.ttl);
                    }
                }
            }
            return decision;
        }
        catch (err) {
            log.info("Encountered problem getting remote decision: %s", errorMessage(err));
            const decision = new ArcjetErrorDecision({
                ttl: 0,
                reason: new ArcjetErrorReason(err),
                results,
            });
            client.report(context, details, decision, rules);
            return decision;
        }
        finally {
            logRemotePerf();
        }
    }
    // This is a separate function so it can be called recursively
    function withRule(baseRules, rule) {
        const rules = [...baseRules, ...rule].sort((a, b) => a.priority - b.priority);
        return Object.freeze({
            withRule(rule) {
                return withRule(rules, rule);
            },
            async protect(ctx, request) {
                return protect(rules, ctx, request);
            },
        });
    }
    return Object.freeze({
        /**
         * Augment the client with another rule.
         *
         * Useful for varying rules based on criteria in your handler such as
         * different rate limit for logged in users.
         *
         * @param rule
         *   Rule to add to Arcjet.
         * @returns
         *   Arcjet instance augmented with the given rule.
         */
        withRule(rule) {
            return withRule(rootRules, rule);
        },
        /**
         * Make a decision about how to handle a request.
         *
         * This will analyze the request locally where possible and otherwise call
         * the Arcjet decision API.
         *
         * @param ctx
         *   Additional context for this function call.
         * @param request
         *   Details about the {@linkcode ArcjetRequest} that Arcjet needs to make a
         *   decision.
         * @returns
         *   Promise that resolves to an {@linkcode ArcjetDecision} indicating
         *   Arcjet’s decision about the request.
         */
        async protect(ctx, request) {
            return protect(rootRules, ctx, request);
        },
    });
}

export { arcjet as default, detectBot, filter, fixedWindow, protectSignup, sensitiveInfo, shield, slidingWindow, tokenBucket, validateEmail };
