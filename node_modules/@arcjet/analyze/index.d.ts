import type { BotConfig, BotResult, DetectedSensitiveInfoEntity, DetectSensitiveInfoFunction, EmailValidationConfig, EmailValidationResult, FilterResult, SensitiveInfoEntities, SensitiveInfoEntity, SensitiveInfoResult } from "@arcjet/analyze-wasm";
import type { ArcjetLogger } from "@arcjet/protocol";
interface AnalyzeContext {
    log: ArcjetLogger;
    characteristics: string[];
}
type AnalyzeRequest = {
    ip?: string;
    method?: string;
    protocol?: string;
    host?: string;
    path?: string;
    headers?: Record<string, string>;
    cookies?: string;
    query?: string;
    extra?: Record<string, string>;
};
export { type EmailValidationConfig, type BotConfig, type FilterResult, type SensitiveInfoEntity, type DetectedSensitiveInfoEntity, };
/**
 * Generate a fingerprint.
 *
 * Fingerprints can be used to identify the client across multiple requests.
 *
 * This considers different things on the `request` based on the passed
 * `context.characteristics`.
 *
 * See [*Fingerprints* on
 * `docs.arcjet.com`](https://docs.arcjet.com/fingerprints/) for more info.
 *
 * @param context
 *   Context.
 * @param request
 *   Request.
 * @returns
 *   Promise for a SHA-256 fingerprint.
 */
export declare function generateFingerprint(context: AnalyzeContext, request: AnalyzeRequest): Promise<string>;
/**
 * Check whether an email is valid.
 *
 * @param context
 *   Context.
 * @param value
 *   Value.
 * @param options
 *   Configuration.
 * @returns
 *   Promise for a result.
 */
export declare function isValidEmail(context: AnalyzeContext, value: string, options: EmailValidationConfig): Promise<EmailValidationResult>;
/**
 * Detect whether a request is by a bot.
 *
 * @param context
 *   Context.
 * @param request
 *   Request.
 * @param options
 *   Configuration.
 * @returns
 *   Promise for a result.
 */
export declare function detectBot(context: AnalyzeContext, request: AnalyzeRequest, options: BotConfig): Promise<BotResult>;
/**
 * Detect sensitive info in a value.
 *
 * @param context
 *   Context.
 * @param value
 *   Value.
 * @param entities
 *   Strategy to use for detecting sensitive info;
 *   either by denying everything and allowing certain tags or by allowing
 *   everything and denying certain tags.
 * @param contextWindowSize
 *   Number of tokens to pass to `detect`.
 * @param detect
 *   Function to detect sensitive info (optional).
 * @returns
 *   Promise for a result.
 */
export declare function detectSensitiveInfo(context: AnalyzeContext, value: string, entities: SensitiveInfoEntities, contextWindowSize: number, detect?: DetectSensitiveInfoFunction): Promise<SensitiveInfoResult>;
/**
 * Check if a filter matches a request.
 *
 * @param context
 *   Arcjet context.
 * @param request
 *   Request.
 * @param expressions
 *   Filter expressions.
 * @returns
 *   Promise to whether the filter matches the request.
 */
export declare function matchFilters(context: AnalyzeContext, request: AnalyzeRequest, expressions: ReadonlyArray<string>, allowIfMatch: boolean): Promise<FilterResult>;
