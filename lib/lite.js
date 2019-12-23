/// @ts-check
(function () {
/**
 * 
 * @param {string|symbol} str 
 */
function isSpace(str) {
    return str === " " || str === "\n" || str === "\t" || str === "\f" || str === "\r";
}

/**
 * 
 * @param {string|symbol} str 
 */
function isLT(str) {
    return str === "<"
}


/**
 * 
 * @param {string|symbol} str 
 */
function isGT(str) {
    return str === ">"
}

/**
 * 
 * @param {string|symbol} str 
 */
function isSlash(str) {
    return str === "/"
}

/**
 * 
 * @param {string|symbol} str 
 */
function isEQ(str) {
    return str === "="
}

/**
 * 
 * @param {string} str 
 * @returns {string}
 */
function escapeString(str) {
    return {"\r":"\\r","\n":"\\n","\"": "\\\"", "\\": "\\\\"}[str] || str
}

/**
 * @param {{[x:string]:any}} Components
 * @param {TemplateStringsArray} strings 
 * @param {any[]} args 
 */
function _html(Components, strings, ...args) {
    const symbolMap = {};

    /**
     * 
     * @param {T[][]} toFlat 
     * @returns {T[]}
     * @template T
     */
    const flat = (toFlat)=>{
        return Array.prototype.concat.apply([], toFlat);
    }

    const str = flat(strings.reduce((/** @type {(string|symbol)[][]} */prev, curr, index)=>{
        if (index > 0) {
            const placeHolder = Symbol(`arg${index - 1}`);
            symbolMap[placeHolder] = `arg${index - 1}`;
            var toAdd = /** @type {(string|symbol)[]} */([placeHolder]).concat(curr.split(''))
            prev.push(toAdd);
        } else {
            prev.push(curr.split(''));
        }
        return prev;
    }, []))

    let ptr = 0;

    function isEOF() {
        return ptr >= str.length;
    }

    function walk (offset) {
        ptr += offset;
    }

    function c(offset = 0) {
        var value = str[ptr + offset];

        if (typeof value !== 'string') {
            throw new Error('get a symbol when access string');
        }

        return value
    }

    function v(offset = 0) {
        var value = str[ptr + offset];

        return value
    }

    function walkUntilNotSpace() {
        while(!isEOF() && isSpace(v())) {
            walk(1);
        }
    }

    /**
     * returns a list of code that generate each elements
     * @returns {string[]}
     */
    function parse() {
        /**
         * @type {string[]}
         */
        let codes = [];

        while ((walkUntilNotSpace(), !isEOF())) {
            const char = v();
            if (isLT(char) && isSlash(c(1))) {
                // end of tag
                return codes;
            } else if (isLT(char)) {
                codes.push(parseElement());
            } else {
                const res = parseText();

                if (res) {
                    codes.push(res);
                } else {
                    debugger
                }
            }
        }

        return codes;
    }

    function parseElement() {
        const leftTag = parseTag();

        if (leftTag.left === 'close') {
            throw new Error('unexpected close left tag');
        }

        if (leftTag.right === 'open') {
            var innerCodes = parse();
            var rightTag = parseTag();
            if (rightTag.right === 'close' || rightTag.left === 'open' || rightTag.attributeCode !== 'null') {
                throw new Error('unexpected right tag');
            }
            
            if (innerCodes.length > 0) {
                return `h(${leftTag.name ? leftTag.name: 'F'},${leftTag.attributeCode},${innerCodes.join(',')})`
            } else {
                return `h(${leftTag.name ? leftTag.name: 'F'},${leftTag.attributeCode})`;
            }

        } else {
            // a self closed tag
            return `h(${leftTag.name},${leftTag.attributeCode})`;
        }
    }

    /**
     * @returns {{
           left: 'open'|'close',
           name: string,
           attributeCode: string,
           right: 'open'|'close'
       }}
     */
    function parseTag() {
        const leftTag = isSlash(c(1)) ? 'close': 'open';
        walk(leftTag === 'close' ? 2: 1);
        const name = parseTagName();
        walkUntilNotSpace();
        const attributeCode = parseAttributes();
        walkUntilNotSpace();
        const rightTag = isSlash(c()) ? 'close': 'open';
        walk(rightTag === 'close' ? 2: 1);

        return {
            left: leftTag,
            name: name,
            attributeCode: attributeCode,
            right: rightTag
        }
    }

    /**
     * @returns {string}
     */
    function parseTagName() {
        let name = '';

        while (
            !isSpace(c()) && 
            !isEOF() && 
            !(isSlash(c()) && isGT(c(1))) &&
            !isGT(c())
        ) {
            name += escape(c());
            walk(1);
        }
        
        if (Components[name] != null) {
            return `C.${name}`
        } else {
            return '"' + name + '"';
        }
    }

    function parseAttributes() {
        let mixins = [];
        let attrs = [];

        walkUntilNotSpace();

        while (
            !isEOF() && 
            !(isSlash(c()) && isGT(c(1))) &&
            !isGT(c())
        ) {
            if (v() === '.' && v(1) === '.' && v(2) === '.') {
                if (typeof v(3) !== 'symbol') {
                    throw new Error('trying to expread string');
                } else if (
                    !isSpace(v(4)) &&
                    !(isSlash(v(4)) && isGT(v(5))) &&
                    !isGT(v(4))
                ) {
                    throw new Error('trying to expread string')
                }

                mixins.push(symbolMap[v(4)]);
                walk(4);
            } else {
                let code = '';
                let name = '';
                let nameHasPlaceHolder = false;
                let value = ''

                while (
                    !isEOF() &&
                    !isSpace(v()) &&
                    !isEQ(v()) &&
                    !(isSlash(v()) && isGT(v(1))) &&
                    !isGT(v())
                ) {
                    const val = v();
                    walk(1);

                    if (typeof val === 'symbol') {
                        name += '"+' + symbolMap[val] + '+"';
                        nameHasPlaceHolder = true;
                    } else {
                        name += escape(val);
                    }
                }

                name = '"' + name + '"';

                if (nameHasPlaceHolder) {
                    code += "[" + name + "]";
                } else {
                    code += name;
                }

                code += ":";

                if (isEQ(v())) {
                    walk(1);
                    if (
                        typeof v() === 'symbol' &&
                        (
                            isSpace(v(1)) ||
                            (isSlash(v(1)) && isGT(v(2))) ||
                            isGT(v(1))
                        )
                    ) {
                        code += symbolMap[v()];
                        walk(2);
                    } else {
                        if (v() === "'") {
                            walk(1)
                            while (
                                !isEOF() &&
                                v() !== "'"
                            ) {
                                const val = v();
                                walk(1);
            
                                if (typeof val === 'symbol') {
                                    value += '"+' + symbolMap[val] + '+"';
                                } else {
                                    value += escape(val);
                                }
                            }
                            walk(1)
                        } else if (v() === '"') {
                            walk(1)
                            while (
                                !isEOF() &&
                                v() !== '"'
                            ) {
                                const val = v();
                                walk(1);
            
                                if (typeof val === 'symbol') {
                                    value += '"+' + symbolMap[val] + '+"';
                                } else {
                                    value += escape(val);
                                }
                            }
                            walk(1)
                        } else {
                            while (
                                !isEOF() &&
                                !isSpace(v()) &&
                                !(isSlash(v()) && isGT(v(1))) &&
                                !isGT(v())
                            ) {
                                const val = v();
                                walk(1);
            
                                if (typeof val === 'symbol') {
                                    value += '"+' + symbolMap[val] + '+"';
                                } else {
                                    value += escape(val);
                                }
                            }
                        }
                        code += '"' + value + '"'
                    }
                } else {
                    code += "true";
                    attrs.push(code);
                }
            }
            walkUntilNotSpace();
        }

        if (isEOF()) {
            throw new Error('encountered eow when parse attributes')
        }

        if (mixins.length === 0 && attrs.length === 0) {
            return 'null'
        } else if (mixins.length > 0 && attrs.length > 0) {
            return `Object.assign({},{${attrs.join(',')}},${mixins.join(',')})`
        } else if (attrs.length > 0) {
            return `{${attrs.join(',')}}`
        } else if (mixins.length > 0) {
            return `Object.assign({},${mixins.join(',')})`
        }
    }

    function parseText() {
        const prevPtr = ptr;
        let lastNonSpace = -1;
        let stagings = "";
        let body = "";

        while (!isEOF() && !isLT(v())) {
            const val = v();

            if (typeof val === "string") {
                stagings += escapeString(val)
            } else {
                stagings += '",' + symbolMap[val] + ',"'
            }

            if (!isSpace(val)) {
                body = stagings;
                lastNonSpace = ptr;
            }

            walk(1)
        }

        if (lastNonSpace < 0) {
            return null;
        } else {
            return `"${body}"`;
        }
    }

    /**
     * @type {string}
     */
    let code;

    const res = parse();

    if (res.length > 1) {
        code = `return h(F,null,${res.join(',')})`;
    } else {
        code = `return ${res[0]}`;
    }


    let argsString = args.reduce((prev, curr, index)=>`${prev},arg${index}`, 'h,F,C')
    //console.log(code);
    //console.log(argsString);
    
    const fn = new Function(argsString, code);
    console.log(fn.toString().slice(0, 1000))

    return fn
}


/**
 * @type {WeakMap<TemplateStringsArray,function>}
 */
const cache = new WeakMap()

/**
 * 
 * @param {function|{creatElement:function,Fragment:any}} ReactOrHyperScript 
 * @param {{[x:string]:any}} Componenets 
 */
function htmlFactory(ReactOrHyperScript, Componenets) {
    const h = typeof ReactOrHyperScript === "function" ? 
        ReactOrHyperScript: (...args)=>ReactOrHyperScript.creatElement(...args);
    const Fragment = typeof ReactOrHyperScript === "function" ? 
        null: ReactOrHyperScript.Fragment;
    
    return (strings, ...args)=>{
        if (cache.has(strings)) {
            return cache.get(strings)(h, Fragment, Componenets, ...args);
        } else {
            const fn =  _html(Componenets, strings, ...args);
            cache.set(strings, fn);
            return fn(h, Fragment, Componenets, ...args)
        }

    }
}

var html = htmlFactory({
    creatElement(name, attr, ...children){
        return {
            name,
            attr,
            children
        }
    }, 
    Fragment: Symbol('fragment')
}, {K: Symbol('K')});

html`<div>test${'test'}<span/></div>123`
html`<div attr=${"test"} attr1=${'te'}st attr${"2"}="test">test<span/></div>`
html`<div attr=1>test<span/></div>`
html`<div ...${'attr'}>test<span/></div>`
html`<div ...${'attr'}>test<span/><div>next</div></div>`

let code = '';

for (let i = 0; i < 10000; i++) {
    if (Math.random() < 0.33) {
        code += "<K>only text here<K/></K>"
    } else if (Math.random() < 0.5) {
        code += `<tag a="123" b='456' ok/>`
    } else {
        code += "<tag/>"
    }
}
var arr = [code];

console.log(code.length);

console.time('test')
var res = html(/** @type {any} */(arr));
console.timeEnd('test')


console.time('test')
for (var i = 0; i < 100; i++) {
    html(/** @type {any} */(arr));
}
console.timeEnd('test')

} ())