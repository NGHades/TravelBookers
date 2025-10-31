import { instantiate } from './wasm/arcjet_analyze_js_req.component.js';
import { wasm } from './_virtual/arcjet_analyze_js_req.component.core.js';
import { wasm as wasm$1 } from './_virtual/arcjet_analyze_js_req.component.core2.js';
import { wasm as wasm$2 } from './_virtual/arcjet_analyze_js_req.component.core3.js';

// Support `?js` and such:
//
/// <reference types="./wasm.js" />
const componentCoreWasmPromise = wasm();
const componentCore2WasmPromise = wasm$1();
const componentCore3WasmPromise = wasm$2();
async function moduleFromPath(path) {
    if (path === "arcjet_analyze_js_req.component.core.wasm") {
        return componentCoreWasmPromise;
    }
    if (path === "arcjet_analyze_js_req.component.core2.wasm") {
        return componentCore2WasmPromise;
    }
    if (path === "arcjet_analyze_js_req.component.core3.wasm") {
        return componentCore3WasmPromise;
    }
    // TODO(@wooorm-arcjet): figure out a test case that makes this throw.
    throw new Error(`Unknown path: ${path}`);
}
/**
 * Initialize the generated WebAssembly component.
 *
 * @param coreImports
 *   Things, typically functions, to pass into the component.
 * @returns
 *   Promise that resolves to the initialized component.
 */
async function initializeWasm(coreImports) {
    try {
        // Await the instantiation to catch the failure
        return instantiate(moduleFromPath, coreImports);
    }
    catch {
        return undefined;
    }
}

export { initializeWasm };
