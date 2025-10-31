import type * as http from "http";
import type * as http2 from "http2";
/**
 * Convert a Node.js header object to a fetch API Headers object.
 *
 * This function works for Node.js incoming and outgoing headers, and for the
 * http and the http2 package.
 *
 * HTTP/2 pseudo-headers (:method, :path, etc.) are stripped.
 */
export declare function nodeHeaderToWebHeader(nodeHeaders: http.OutgoingHttpHeaders | http.IncomingHttpHeaders | http2.IncomingHttpHeaders | http.IncomingMessage["trailers"]): Headers;
/**
 * Convert a fetch API Headers object to a Node.js headers object.
 *
 * Optionally accepts default Node.js headers. If provided, fetch API headers
 * are appended to the defaults. The original defaults headers are not modified.
 */
export declare function webHeaderToNodeHeaders(headersInit: HeadersInit, defaultNodeHeaders?: http.OutgoingHttpHeaders): http.OutgoingHttpHeaders;
export declare function webHeaderToNodeHeaders(headersInit: HeadersInit | undefined): http.OutgoingHttpHeaders | undefined;
