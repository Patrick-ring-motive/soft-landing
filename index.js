(() => {
    const q = (varFn) => {
        try {
            return varFn?.();
        } catch (e) {
            if (e.name != "ReferenceError") {
                throw e;
            }
        }
    };
    const globalObject =
        q(() => globalThis) ??
        q(() => self) ??
        q(() => global) ??
        q(() => window) ??
        this ??
        {};
    for (let x of ["globalThis", "self", "global"]) {
        globalObject[x] = globalObject;
    }
    const newQ = (...args) => {
        const fn = args?.shift?.();
        return fn && new fn(...args);
    };

    const objDoProp = function (obj, prop, def, enm, mut) {
        return Object.defineProperty(obj, prop, {
            value: def,
            writable: mut,
            enumerable: enm,
            configurable: mut,
        });
    };
    const objDefProp = (obj, prop, def) =>
        objDoProp(obj, prop, def, false, true);
    const objDefEnum = (obj, prop, def) =>
        objDoProp(obj, prop, def, true, true);
    const objFrzProp = (obj, prop, def) =>
        objDoProp(obj, prop, def, false, false);
    const objFrzEnum = (obj, prop, def) =>
        objDoProp(obj, prop, def, true, false);

    function stealth(shadow, original) {
        shadow = Object(shadow);
        original = Object(original);
        objDefProp(shadow, "toString", function toString() {
            return original.toString();
        });
        Object.setPrototypeOf(shadow, original);
        return shadow;
    }

    function intercede(root, name, key, fn) {
        root = Object(root);
        name = String(name);
        fn = Object(fn);
        objDefProp(root, key, root?.[name]);
        objDefEnum(root, name, fn);
        stealth(root?.[name], root?.[key]);
    }
    const fetchKey = Symbol("fetch");
    intercede(globalThis, "fetch", fetchKey, async function fetch(input, init) {
        try {
            let req;
            let method = init?.method ?? "GET";
            try {
                req = new Request(...arguments);
                return await globalThis[fetchKey].call(this, req);
            } catch (e) {
                let res;
                if (/cannot have body/i.test(String(e))) {
                    objDefEnum(arguments[1] ?? {}, "method", "POST");
                    req = new Request(...arguments);
                    req.headers.set("method", method);
                    res = await globalThis[fetchKey].call(this, req);
                } else {
                    throw e;
                }
                if (res.status == 405) {
                    objDefEnum(arguments[1] ?? {}, "method", method);
                    const body = arguments[1]?.body;
                    delete arguments[1]?.body;
                    req = new Request(...arguments);
                    if (body) {
                        try {
                            req.headers.set("body", body);
                        } catch (e) {
                            console.warn(e, ...arguments);
                        }
                    }
                    return await globalThis[fetchKey].call(this, req);
                }
                return res;
            }
        } catch (e) {
            console.warn(e, ...arguments);
            return new Response(
                Object.getOwnPropertyNames(e)
                    .map((x) => `${x}: ${e[x]}`)
                    .join("\n"),
                {
                    status: 569,
                    statusText: e.message,
                    headers: { "content-type": "text/html" },
                },
            );
        }
    });
})?.();

void (async function () {
    console.log(
        await fetch("https://www.google.com/", {
            method: "get",
            body: "h",
        }),
    );
})();
