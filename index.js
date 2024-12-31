/**
 * Immediately Invoked Function Expression that modifies global fetch and Response for extended functionality.
 */
(() => {
    /**
     * Safely invokes a function if it exists, returning undefined if it throws a ReferenceError.
     * @function
     * @param {Function} varFn - A function to invoke.
     * @returns {*} The result of varFn if it doesn't throw a ReferenceError; otherwise undefined.
     */
    const q = (varFn) => {
        try {
            return varFn?.();
        } catch (e) {
            if (e.name != "ReferenceError") {
                throw e;
            }
        }
    };

    /**
     * Derives a global object reference from the best available environment (globalThis, self, global, window, etc.).
     * @type {Object}
     */
    const globalObject =
        q(() => globalThis) ??
        q(() => self) ??
        q(() => global) ??
        q(() => window) ??
        this ??
        {};

    // Provide the global object under multiple names for convenience.
    for (let x of ["globalThis", "self", "global"]) {
        globalObject[x] = globalObject;
    }

    /**
     * Creates a new instance from a constructor (the first element in args) with the remaining elements as its arguments.
     * @function
     * @param {...*} args - The first element should be a constructor. The remaining are passed as constructor arguments.
     * @returns {*} A new instance if fn is valid, otherwise undefined.
     */
    const newQ = (...args) => {
        const fn = args?.shift?.();
        return fn && new fn(...args);
    };

    /**
     * An XMLSerializer instance, created using newQ.
     * @type {XMLSerializer}
     */
    const serializer = newQ(globalThis.XMLSerializer);

    /**
     * Serializes an XML Node to a string using the serializer.
     * @function
     * @param {Node} node - The XML Node to serialize.
     * @returns {string} The serialized XML string.
     */
    const serializeXML = (node) => serializer?.serializeToString?.(node);

    /**
     * Converts an ArrayBuffer or array-like to a Uint8Array.
     * @function
     * @param {ArrayBuffer|ArrayLike<number>} buff - The buffer to convert.
     * @returns {Uint8Array} The resulting Uint8Array.
     */
    const bytes = (buff) => new Uint8Array(buff);

    /**
     * A TextEncoder instance, created using newQ.
     * @type {TextEncoder}
     */
    const encoder = newQ(globalThis.TextEncoder);

    /**
     * Encodes a string into UTF-8 bytes. Falls back to manual charCodeAt if no global encoder is available.
     * @function
     * @param {string} s - The string to encode.
     * @returns {Uint8Array} The UTF-8 encoded bytes.
     */
    const encode = (s) =>
        encoder?.encode?.(s) ?? bytes(s.split``.map((x) => x.charCodeAt()));

    /**
     * Encodes a string to UTF-8 and returns the ArrayBuffer.
     * @function
     * @param {string} s - The string to encode.
     * @returns {ArrayBuffer} The encoded ArrayBuffer.
     */
    const buffer = (s) => encode(s).buffer;

    /**
     * A TextDecoder instance, created using newQ.
     * @type {TextDecoder}
     */
    const decoder = newQ(globalThis.TextDecoder);

    /**
     * Decodes UTF-8 bytes (Uint8Array/ArrayBuffer) to a string. Falls back to String.fromCharCode if needed.
     * @function
     * @param {Uint8Array|ArrayBuffer} byte - The data to decode.
     * @returns {string} The decoded string.
     */
    const decode = (byte) =>
        decoder?.decode?.(byte) ?? String.fromCharCode(...byte);

    /**
     * Converts an ArrayBuffer to a string via UTF-8 decoding.
     * @function
     * @param {ArrayBuffer} buff - The ArrayBuffer to decode.
     * @returns {string} The decoded string.
     */
    const text = (buff) => decode(bytes(buff));

    /**
     * Creates a new Blob from a buffer (ArrayBuffer or similar).
     * @function
     * @param {ArrayBuffer|ArrayLike<number>} buff - The buffer to convert into a Blob.
     * @returns {Blob} The resulting Blob.
     */
    const blob = (buff) => new Blob([buff]);

    /**
     * Defines a property on an object with given enumerability/writability/configurability.
     * @function
     * @param {Object} obj - The target object.
     * @param {string} prop - The name of the property to define.
     * @param {*} def - The property value.
     * @param {boolean} enm - If true, the property is enumerable.
     * @param {boolean} mut - If true, the property is writable and configurable.
     * @returns {Object} The modified object.
     */
    const objDoProp = function (obj, prop, def, enm, mut) {
        return Object.defineProperty(obj, prop, {
            value: def,
            writable: mut,
            enumerable: enm,
            configurable: mut,
        });
    };

    /**
     * Defines a non-enumerable, configurable property on an object.
     * @function
     * @param {Object} obj - The target object.
     * @param {string} prop - The property name.
     * @param {*} def - The property value.
     * @returns {Object} The modified object.
     */
    const objDefProp = (obj, prop, def) =>
        objDoProp(obj, prop, def, false, true);

    /**
     * Defines an enumerable, configurable property on an object.
     * @function
     * @param {Object} obj - The target object.
     * @param {string} prop - The property name.
     * @param {*} def - The property value.
     * @returns {Object} The modified object.
     */
    const objDefEnum = (obj, prop, def) =>
        objDoProp(obj, prop, def, true, true);

    /**
     * Defines a non-enumerable, non-configurable property on an object (frozen).
     * @function
     * @param {Object} obj - The target object.
     * @param {string} prop - The property name.
     * @param {*} def - The property value.
     * @returns {Object} The modified object.
     */
    const objFrzProp = (obj, prop, def) =>
        objDoProp(obj, prop, def, false, false);

    /**
     * Defines an enumerable, non-configurable property on an object (frozen).
     * @function
     * @param {Object} obj - The target object.
     * @param {string} prop - The property name.
     * @param {*} def - The property value.
     * @returns {Object} The modified object.
     */
    const objFrzEnum = (obj, prop, def) =>
        objDoProp(obj, prop, def, true, false);

    /**
     * Creates a 'stealth' object whose prototype is set to 'original' but 'toString' returns original.toString().
     * @function
     * @param {Object} shadow - The base object to modify.
     * @param {Object} original - The object whose prototype and toString should be used.
     * @returns {Object} The shadow object with the updated prototype and toString.
     */
    function stealth(shadow, original) {
        shadow = Object(shadow);
        original = Object(original);
        objDefProp(shadow, "toString", function toString() {
            return original.toString();
        });
        Object.setPrototypeOf(shadow, original);
        return shadow;
    }

    /**
     * Intercepts a property on an object by storing the original under a symbol, then defining a new enumerable property.
     * @function
     * @param {Object} root - The object containing the property to intercede.
     * @param {string} name - The name of the property to replace.
     * @param {Symbol} key - The symbol under which to store the original property value.
     * @param {Function} fn - The new property value (often a function).
     */
    function intercede(root, name, key, fn) {
        root = Object(root);
        name = String(name);
        fn = Object(fn);
        objDefProp(root, key, root?.[name]);
        objDefEnum(root, name, fn);
        stealth(root?.[name], root?.[key]);
    }

    /**
     * A Symbol used to store the native fetch under globalThis.
     * @constant
     * @type {Symbol}
     */
    const $fetch = Symbol("*fetch");

    // Intercept the global fetch function to implement custom request/response handling.
    intercede(globalThis, "fetch", $fetch, async function fetch(input, init) {
        let request, presponse, response;
        try {
            let method = init?.method ?? "GET";
            try {
                // Attempt standard fetch
                request = new Request(...arguments);
                presponse = globalThis[$fetch].call(this, request);
                response = await presponse;
            } catch (e) {
                // If the request method doesn't allow a body, or triggers certain errors, handle them here
                if (/cannot have body/i.test(String(e))) {
                    objDefEnum(arguments[1] ?? {}, "method", "POST");
                    request = new Request(...arguments);
                    request.headers.set("method", method);
                    response = await globalThis[$fetch].call(this, request);
                } else {
                    throw e;
                }

                if (response.status == 405) {
                    // Retry with the original method but remove the body if it caused an issue
                    objDefEnum(arguments[1] ?? {}, "method", method);
                    const body = arguments[1]?.body;
                    delete arguments[1]?.body;
                    request = new Request(...arguments);
                    if (body) {
                        try {
                            request.headers.set("body", body);
                        } catch (e) {
                            console.warn(e, ...arguments);
                        }
                    }
                    presponse = globalThis[$fetch].call(this, request);
                    response = await presponse;
                }
                // Track request/response
                objDefProp(response, "&arguments", [...arguments]);
                objDefProp(response, "&request", request);
                objDefProp(response, "&presponse", presponse);

                return response;
            }
        } catch (e) {
            console.warn(e, ...arguments);
            // On errors, create a synthetic Response detailing the exception
            response = new Response(
                Object.getOwnPropertyNames(e)
                    .map((x) => `${x}: ${e[x]}`)
                    .join("\n"),
                {
                    status: 569,
                    statusText: e.message,
                    headers: { "content-type": "text/html" },
                }
            );
        }
        // Attach extra data to the real response
        objDefProp(response, "&arguments", [...arguments]);
        objDefProp(response, "&request", request);
        objDefProp(response, "&presponse", presponse);

        return response;
    });

    // Ensure the newly defined fetch has the original fetch in its prototype chain.
    Object.setPrototypeOf(globalThis.fetch, globalThis[$fetch]);

    /**
     * A Symbol used to store the original arrayBuffer method on Response.prototype.
     * @constant
     * @type {Symbol}
     */
    const $arrayBuffer = Symbol("*arrayBuffer");

    // Preserve the native arrayBuffer method on Response
    objDefProp(Response.prototype, $arrayBuffer, Response.prototype.arrayBuffer);

    /**
     * Enhances or replaces a Response method (like arrayBuffer, json, text, etc.) to provide caching and extra functionalities.
     * @function
     * @param {string} method - The name of the method to patch on Response.prototype.
     */
    function ResponseMethod(method) {
        const $method = Symbol(`*${method}`);
        objDefProp(Response.prototype, $method, method);
        objDefEnum(Response.prototype, method, async function method() {
            // If we don't have a cached "&buffer" yet, retrieve it from arrayBuffer.
            if (!this["&buffer"]) {
                this["&buffer"] = await this[$arrayBuffer]();
                /**
                 * Re-define the standard Body mixin methods, but now they return the cached data.
                 */
                objDefEnum(this, "arrayBuffer", function arrayBuffer() {
                    return this["&buffer"];
                });
                objDefEnum(this, "text", function text() {
                    try {
                        return text(this["&buffer"]);
                    } catch (e) {
                        console.warn(e, this, ...arguments);
                        return String.fromCharCode(...bytes(this["&buffer"]));
                    }
                });
                objDefEnum(this, "blob", function blob() {
                    return blob(this["&buffer"]);
                });
                objDefEnum(this, "bytes", function bytes() {
                    return bytes(this["&buffer"]);
                });
                objDefEnum(this, "json", function json() {
                    return JSON.parse(this.text());
                });
                objDefEnum(this, "formData", function formData() {
                    // Attempt to parse form-encoded data from the text.
                    const parsedData = newQ(globalThis.FormData) ?? new Map();
                    parsedData.append ??= function append(name, value) {
                        return this.set(Object(name), value);
                    };
                    try {
                        const txt = String(this.text());
                        const boundary = String(txt.match(/^-{2}[\w]+/)?.[0]);
                        const regex = new RegExp(
                            `name="([^"]+)"\\s*\\r\\n\\r\\n([\\s\\S]*?)\\r\\n${boundary}`,
                            "g"
                        );

                        let match;
                        while ((match = regex.exec(txt)) !== null) {
                            const key = String(match?.[1]);
                            const value = String(match?.[2])?.trim();
                            parsedData.append(key, value);
                        }
                    } catch (e) {
                        console.warn(e, this, ...arguments);
                        parsedData.append(e.name ?? "error", e.message);
                    }

                    return parsedData;
                });
                objDefEnum(
                    this,
                    "body",
                    new Response(this["&buffer"]).body
                );
                objDefEnum(this, "stream", function stream() {
                    return new Response(this["&buffer"]).body;
                });
            }
            // Call the method on the patched Response.
            return this[method]();
        });
        // Make the original method's prototype link back for reference.
        Response.prototype[$method] ??
            Object.setPrototypeOf(Response.prototype[method], Response.prototype[$method]);
    }

    // Patch the listed methods on Response for extended caching/handling.
    [
        "arrayBuffer",
        "blob",
        "formData",
        "json",
        "text",
        "bytes",
        "stream",
    ].forEach((x) => ResponseMethod(x));
})?.();

/**
 * A simple self-invoking async function that demonstrates usage of our custom fetch logic.
 */
void (async function () {
    console.log(
        (await fetch("https://www.google.com/", {
            method: "get",
            body: "h",
        }))
    );
})();
