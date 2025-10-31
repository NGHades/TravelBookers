import { Message } from "@bufbuild/protobuf";
import type { PartialMessage, ServiceType, MethodInfo, MethodInfoBiDiStreaming, MethodInfoClientStreaming, MethodInfoServerStreaming, MethodInfoUnary } from "@bufbuild/protobuf";
import type { Transport } from "./transport.js";
import type { CallOptions } from "./call-options.js";
/**
 * Client is a simple client that supports unary and server-streaming
 * methods. Methods will produce a promise for the response message,
 * or an asynchronous iterable of response messages.
 */
export type Client<T extends ServiceType> = {
    [P in keyof T["methods"]]: T["methods"][P] extends MethodInfoUnary<infer I, infer O> ? (request: PartialMessage<I>, options?: CallOptions) => Promise<O> : T["methods"][P] extends MethodInfoServerStreaming<infer I, infer O> ? (request: PartialMessage<I>, options?: CallOptions) => AsyncIterable<O> : T["methods"][P] extends MethodInfoClientStreaming<infer I, infer O> ? (request: AsyncIterable<PartialMessage<I>>, options?: CallOptions) => Promise<O> : T["methods"][P] extends MethodInfoBiDiStreaming<infer I, infer O> ? (request: AsyncIterable<PartialMessage<I>>, options?: CallOptions) => AsyncIterable<O> : never;
};
/**
 * @deprecated use Client
 */
export type PromiseClient<T extends ServiceType> = Client<T>;
/**
 * Create a Client for the given service, invoking RPCs through the
 * given transport.
 */
export declare function createClient<T extends ServiceType>(service: T, transport: Transport): Client<T>;
/**
 * @deprecated use createClient.
 */
export declare function createPromiseClient<T extends ServiceType>(service: T, transport: Transport): Client<T>;
/**
 * UnaryFn is the method signature for a unary method of a PromiseClient.
 */
type UnaryFn<I extends Message<I>, O extends Message<O>> = (request: PartialMessage<I>, options?: CallOptions) => Promise<O>;
export declare function createUnaryFn<I extends Message<I>, O extends Message<O>>(transport: Transport, service: ServiceType, method: MethodInfo<I, O>): UnaryFn<I, O>;
/**
 * ServerStreamingFn is the method signature for a server-streaming method of
 * a PromiseClient.
 */
type ServerStreamingFn<I extends Message<I>, O extends Message<O>> = (request: PartialMessage<I>, options?: CallOptions) => AsyncIterable<O>;
export declare function createServerStreamingFn<I extends Message<I>, O extends Message<O>>(transport: Transport, service: ServiceType, method: MethodInfo<I, O>): ServerStreamingFn<I, O>;
/**
 * ClientStreamFn is the method signature for a client streaming method of a
 * PromiseClient.
 */
type ClientStreamingFn<I extends Message<I>, O extends Message<O>> = (request: AsyncIterable<PartialMessage<I>>, options?: CallOptions) => Promise<O>;
export declare function createClientStreamingFn<I extends Message<I>, O extends Message<O>>(transport: Transport, service: ServiceType, method: MethodInfo<I, O>): ClientStreamingFn<I, O>;
/**
 * BiDiStreamFn is the method signature for a bi-directional streaming method
 * of a PromiseClient.
 */
type BiDiStreamingFn<I extends Message<I>, O extends Message<O>> = (request: AsyncIterable<PartialMessage<I>>, options?: CallOptions) => AsyncIterable<O>;
export declare function createBiDiStreamingFn<I extends Message<I>, O extends Message<O>>(transport: Transport, service: ServiceType, method: MethodInfo<I, O>): BiDiStreamingFn<I, O>;
export {};
