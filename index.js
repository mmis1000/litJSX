// @ts-check

(function() {
    
class Data {
    constructor(parent = null) {
        /** @type {Data} */
        this.parent = parent
    }
}

const STATE = {
    INIT: Symbol('init'),
    LEAVE: Symbol('leave'),
    SKIP_SPACE: Symbol('skip_space'),
}

Object.freeze(STATE);

/**
 * @typedef {function(Context):any} RuleHandle
 */

/**
 * @typedef {Object.<string|symbol, RuleHandle|Rule>} Rule
 */

/**
 * @class Context
 */
class Context {
    /**
     * 
     * @param {Rule} rule 
     * @param {string} str
     */
    constructor(rule, str) {
        /** @type {Rule} */
        this.rule = rule;
        /** @type {Data} */
        this.data = new Data;
        /** @type {boolean} */
        this.finished = false;
        /** @type {Rule|symbol} */
        this.state = STATE.INIT

        /** @type {Rule[]} */
        this.stack = [];
        /** @type {Rule} */
        this.current

        /** @type {string} */
        this.str = str;
        /** @type {number} */
        this.ptr = 0;

        Object.defineProperty(this, 'current', {
            get:()=> {return this.stack[this.stack.length - 1]}
        })
    }

    enter() {
        /**
         * @type {Data}
         */
        this.data = new Data(this.data);
    }

    /**
     * @returns {void}
     */
    leave() {
        if (this.data.parent != null) {
            this.data = this.data.parent;
        } else {
            this.finished = true;
            return;
        }
    }

    run() {
        this.stack.push(this.rule);

        while (!this.finished) {
            // console.log(this.state)

            if (typeof this.state === 'object') {
                this.stack.push(this.state);
                this.state = STATE.INIT;
                this.enter();
            } else if (this.state === STATE.LEAVE) {
                this.stack.pop()
                this.leave();
                this.state = STATE.INIT;
            }

            if (this.current == null) {
                this.finished = true;
                break;
            }

            this.current[this.state](this);
        }

        return this.data;
    }

    /**
     * walk until position matched specified regex
     * and consume the string
     * @param {RegExp} regex 
     * @returns {string}
     */
    walk(regex) {
        // reset the regex
        let ptr = this.ptr;

        let result = null;

        regex.lastIndex = 0;

        while (ptr < this.str.length && !regex.test(this.str.slice(ptr))) {
            regex.lastIndex = 0;
            ptr++;
        }

        if (ptr >= this.str.length) {
            if (regex.test(this.str.slice(ptr))) {
                // exactly match empty string?
                let oldPtr = this.ptr;
                this.ptr = ptr;
                return this.str.slice(oldPtr, ptr)
            } else {
                return null;
            }
        } else {
            let oldPtr = this.ptr
            this.ptr = ptr
            return this.str.slice(oldPtr, ptr)
        }
    }

    /**
     * test whether current position match specifiec regex
     * @param {RegExp} regex 
     */
    expect(regex) {
        regex.lastIndex = 0;
        return regex.test(this.str.slice(this.ptr));
    }
}

var regexs = {
    until_not_space: /^[^\s\r\n]/,
    until_tag: /^<|^$/,
}

var JSX_STATE = Object.assign({}, STATE, {
    MATCH_TAG: Symbol('match_tag'),
    TAG: {
        LEFT: {
            OPEN: Symbol('open'),
            CLOSE: Symbol('close'),
        },
        NAME: Symbol('name'),
        ATTRIB: {
            SPREAD: Symbol('spread'),
            NAME: Symbol('name'),
            VALUE: Symbol('value'),
        },
        RIGHT: {
            OPEN: Symbol('open'),
            CLOSE: Symbol('close'),
        },
    }
})

class JSXElement {
    /**
     * 
     * @param {string} name 
     * @param {Object<string, string>} attributes 
     * @param {(JSXElement|string)[]} elements 
     */
    constructor (name = "", attributes = {}, elements = [], parent = null) {
        /** @type {string} */
        this.name = name;
        /** @type {Object<string, string>} */
        this.attributes = attributes;
        /** @type {string[]} */
        this.attributeMixins = [];
        /** @type {(JSXElement|string)[]} */
        this.elements = elements;
        /** @type {JSXElement} */
        this.parent = parent;
    }

    /**
     * 
     * @param {JSXElement} element 
     */
    append(element) {
        this.elements.push(element);
    }

    toJSON() {
        return {
            name: this.name,
            attributes: this.attributes,
            elements: this.elements.map((el=>typeof el === "string" ? el : el.toJSON())),
            attributeMixins: this.attributeMixins
        }
    }
}

/**
 * @typedef {Object} RootData
 * @property {boolean} initilized
 * @property {JSXElement} tree
 * @property {JSXElement[]} stack
 * @property {function(string, Object<string, string>, string[], JSXElement[]):void} addAndEnter
 * @property {function(string, Object<string, string>, string[], JSXElement[]):void} add
 * @property {function():void} leave
 * @property {JSXElement} top
 */

/**
 * @typedef {Object} TagData
 * @property {boolean} initilized
 * @property {string} name - may be null for <> and </> tag
 * @property {RootData} parent
 * @property {"open"|"close"} left
 * @property {"open"|"close"} right
 * @property {Object<string, string>} attributes
 * @property {string[]} attributeMixins
 * @property {"left"|"name"|"attributes"|"right"} part
 */

/**
 * @typedef {Object} AttributeData
 * @property {TagData} parent
 * @property {string} name;
 */

/** @type {Rule} */
var rules = {
    [JSX_STATE.INIT] (/** @type {Context} */context) {
        var data = /** @type {RootData} */( /** @type {any} */(context.data));

        if (!data.initilized) {

            data.initilized = true;
            data.tree = new JSXElement("__Fragment__");
            data.stack = [data.tree];

            Object.defineProperty(data, 'top', {
                get () {return data.stack[data.stack.length - 1]}
            })

            data.addAndEnter = function (name, attributes, mixins, elements) {
                var newElement = new JSXElement(name, attributes, elements, data.top);
                newElement.attributeMixins = mixins || [];
                data.top.append(newElement);
                data.stack.push(newElement);
            }

            data.add = function (name, attributes, mixins, elements) {
                var newElement = new JSXElement(name, attributes, elements, data.top);
                newElement.attributeMixins = mixins || [];
                data.top.append(newElement);
            }

            data.leave = function () {
                data.stack.pop();
            }
        }


        if (context.expect(/^$/)) {
            context.state = JSX_STATE.LEAVE;
            if (data.stack.length !== 1) {
                throw new Error('unclosed tags ' + data.stack.slice(1).map((t)=>`<${t.name}>`).join(""))
            }
        } else {
            context.state = JSX_STATE.SKIP_SPACE;
        }
    },
    [JSX_STATE.SKIP_SPACE] (/** @type {Context} */context) {
        context.walk(regexs.until_not_space)
        context.state = JSX_STATE.MATCH_TAG;
    },
    [JSX_STATE.MATCH_TAG] (/** @type {Context} */context) {
        if (context.expect(/^</)) {
            // it is a tag
            context.state = this.TAG;
        } else {
            // it is a piece of text
            context.state = this.TEXT;
        }
    },
    TAG: {
        [JSX_STATE.INIT] (/** @type {Context} */context) {
            var data = /** @type {TagData} */( /** @type {any} */(context.data));

            if (!data.initilized) {
                data.initilized = true;
                data.attributes = {};
                data.attributeMixins = [];
                data.name = null;
                data.left = null;
                data.attributes = {};
                data.right = null;
                data.part = "left";
                
                context.state = this.LEFT;
                return;
            }

            if (data.part === "left") {
                data.part = "name";
                context.state = JSX_STATE.TAG.NAME;
                return;
            }

            if (data.part === "name") {
                data.part = "attributes";
                context.state = this.ATTRIB;
                return;
            }
            if (data.part === "attributes") {
                data.part = "right";
                context.state = this.RIGHT;
                return;
            }
            if (data.part === "right") {
                // console.log(data)
                
                if (data.left === "close" && data.right === "close") {
                    throw new Error('both end clossed tag');
                } else if (data.left === "close") {
                    if (Object.keys(data.attributes).length > 0) {
                        throw new Error("close tag can't has attribute");
                    }

                    // check if the tag matches
                    if ((data.name  || "__Fragment__") !== data.parent.top.name) {
                        throw new Error(`wat? <${data.parent.top.name}></${data.name}>`)
                    }
                    data.parent.leave();
                } else if (data.right === "close") {
                    // self close tag
                    data.parent.add(data.name || '__Fragment__', data.attributes, data.attributeMixins, []);
                } else {
                    // a both end open tag
                    data.parent.addAndEnter(data.name || '__Fragment__', data.attributes, data.attributeMixins, []);
                }
                
                context.state = JSX_STATE.LEAVE;
                return;
            }

        },
        LEFT: {
            [JSX_STATE.INIT] (/** @type {Context} */context) {
                var data = /** @type {TagData} */( /** @type {any} */(context.data.parent));
                
                if (context.expect(/^<\//)) {
                    context.ptr += 2
                    data.left = "close"
                } else {
                    context.ptr += 1
                    data.left = "open"
                }

                context.state = STATE.LEAVE;
            }
        },
        [JSX_STATE.TAG.NAME](/** @type {Context} */context) {
            context.walk(regexs.until_not_space);
            var name = context.walk(/^(\s|\/?>)/)
            var data = /** @type {TagData} */( /** @type {any} */(context.data));
            data.name = name;
            
            context.state = STATE.INIT;
        },
        ATTRIB: {
            [JSX_STATE.INIT] (/** @type {Context} */context) {
                context.walk(regexs.until_not_space);

                if (context.expect(/^\/?>/)) {
                    // right tag
                    context.state = STATE.LEAVE;
                } else if (context.expect(/^\.\.\.[^\s]/)) {
                    context.state = JSX_STATE.TAG.ATTRIB.SPREAD;
                } else {
                    context.state = JSX_STATE.TAG.ATTRIB.NAME;
                }
            },
            [JSX_STATE.TAG.ATTRIB.SPREAD] (/** @type {Context} */context) {
                // remove ...
                context.ptr += 3;
                var text = context.walk(/^(\s|\r|\n|\/?>)/)
                var parentData = /** @type {TagData} */( /** @type {any} */(context.data.parent));

                parentData.attributeMixins.push(text);
                context.state = JSX_STATE.INIT;
            },
            [JSX_STATE.TAG.ATTRIB.NAME](/** @type {Context} */context) {
                var text = context.walk(/^(=|\s|\/?>)/);

                var data = /** @type {AttributeData} */( /** @type {any} */(context.data));
                var parentData = /** @type {TagData} */( /** @type {any} */(context.data.parent));

                if (text.length === 0) {
                    throw new Error('attribute without name')
                } else if (context.expect(/^=[^\s]+/)) {
                    context.ptr++;
                    data.name = text;
                    context.state = JSX_STATE.TAG.ATTRIB.VALUE;
                } else if (context.expect(/^=/)) {
                    context.ptr++;
                    parentData.attributes[text] = "";
                    context.state = JSX_STATE.INIT;
                } else {
                    // either <tag attr> pr <tag attr/>
                    parentData.attributes[text] = "";
                    context.state = JSX_STATE.INIT;
                }
            },
            [JSX_STATE.TAG.ATTRIB.VALUE](/** @type {Context} */context) {
                if (context.expect(/^['"']/)) {
                    if (context.expect(/^'/)) {
                        context.ptr++;
                        var text = context.walk(/^'/);
                        context.ptr++;
                    } else {
                        context.ptr++;
                        var text = context.walk(/^"/);
                        context.ptr++;
                    }
                } else {
                    var text = context.walk(/^(\s|\/>|>)/);
                }
                var data = /** @type {AttributeData} */( /** @type {any} */(context.data));
                var parentData = /** @type {TagData} */( /** @type {any} */(context.data.parent));

                parentData.attributes[data.name] = text;
                context.state = STATE.INIT;
            }
        },
        RIGHT: {
            [JSX_STATE.INIT] (/** @type {Context} */context) {
                var data = /** @type {TagData} */( /** @type {any} */(context.data.parent));
                
                if (context.expect(/^\/>/)) {
                    context.ptr += 2;
                    data.right = "close"
                } else {
                    context.ptr += 1;
                    data.right = "open"
                }

                context.state = STATE.LEAVE;
            }
        },
    },
    TEXT: {
        [JSX_STATE.INIT] (/** @type {Context} */context) {
            var text = context.walk(regexs.until_tag);

            if (text == null) {
                throw new Error('unknown state, how should I enter here?')
            }

            var data = /** @type {RootData} */( /** @type {any} */(context.data.parent));

            if (text.match(/[^\s\r\n]/)) {
                data.top.elements.push(text.replace(/[\s|\r|\n]+$/, ''));
            }

            context.state = JSX_STATE.LEAVE;
        }
    }
}

/**
 * 
 * @param {{createElement: function(any,any,any):any}} React 
 * @param {Object<string, {createElement: function(any,any,any):any}>} components 
 */
function jsx(React, components) {
    return function (strings, ...value) {
        let placeholders = []
        let joined = "";
        let rand = Math.random().toString(16).slice(2, 10)

        for (let i = 0; i < strings.length; i++) {
            if (i > 0) {
                joined += `$place_${rand}_${i - 1}$`;
                placeholders.push(`$place_${rand}_${i - 1}$`)
            }
            joined += strings[i];
        }

        var placeholderRegex = new RegExp(`\\$place_${rand}_\\d+\\$`, "g");
        var walker = new Context(rules, joined);

        // console.time('parse');
        var tree = /** @type {any}*/(walker.run()).tree;
        // console.timeEnd('parse');

        /**
         * 
         * @param {JSXElement} dom 
         */
        function codegen(dom) {

            /**
             * 
             * @param {JSXElement} node 
             */
            function gen(node) {
                if (typeof node === 'string') {
                    return JSON.stringify(node).replace(placeholderRegex, function (match) {
                        return '" , ' + match + ' , "'
                    });
                } else {
                    return `
                        React.createElement(${
                            node.name == '__Fragment__' ?
                            'React.Fragment':
                            components[node.name] !== undefined ?
                            'components.' + node.name:
                            JSON.stringify(node.name)

                        }, ${
                            node.attributeMixins.length > 0?
                            'Object.assign({}, {' + 
                                Object.keys(node.attributes).map((key)=>{
                                    var prop = ''

                                    if (key.match(placeholderRegex)) {
                                        // placeholder in key cl${"s"}s=test
                                        prop += '[' + JSON.stringify(key).replace(placeholderRegex, function (match) {
                                            return '" + ' + match + ' + "'
                                        }) + ']';
                                    } else {
                                        prop += JSON.stringify(key);
                                    }

                                    prop += ': '

                                    var value = node.attributes[key];
                                    var res = value.match(placeholderRegex);

                                    if (res) {
                                        if (res[0] === value) {
                                            // a full match var=${"val"}
                                            prop += res[0];
                                        } else {
                                            // a parital match var=a{"val"}
                                            prop += JSON.stringify(value).replace(placeholderRegex, function (match) {
                                                return '" + ' + match + ' + "'
                                            })
                                        }
                                    } else {
                                        prop += JSON.stringify(value);
                                    }

                                    return prop;
                                }).join(',\n') + 
                            '}, ' + node.attributeMixins.map(function (str) {
                                if (!str.match(placeholderRegex)) {
                                    throw new Error('cannot expand a string ' + str)
                                } else {
                                    return str.match(placeholderRegex)[0];
                                }
                            }).join(', ') + ')': // apply mixins
                            Object.keys(node.attributes).length > 0?
                            '{' + 
                            Object.keys(node.attributes).map((key)=>{
                                var prop = ''

                                if (key.match(placeholderRegex)) {
                                    // placeholder in key cl${"s"}s=test
                                    prop += '[' + JSON.stringify(key).replace(placeholderRegex, function (match) {
                                        return '" + ' + match + ' + "'
                                    }) + ']';
                                } else {
                                    prop += JSON.stringify(key);
                                }

                                prop += ': '

                                var value = node.attributes[key];

                                var res = value.match(placeholderRegex);

                                if (res) {
                                    if (res[0] === value) {
                                        // a full match var=${"val"}
                                        prop += res[0];
                                    } else {
                                        // a parital match var=a{"val"}
                                        prop += JSON.stringify(value).replace(placeholderRegex, function (match) {
                                            return '" + ' + match + ' + "'
                                        })
                                    }
                                } else {
                                    prop += JSON.stringify(value);
                                }

                                return prop;
                            }).join(',\n') + 
                        '}': // property only
                            'null'
                        }, 
                            ${node.elements.map(gen).join(",\n")}
                        ) 
                    `
                }
            }
            
            return "return " + gen(dom).replace(/^[\s\r\n]+/, '');
        }



        // console.time('gen');
        var code = codegen(tree);
        // console.timeEnd('gen');
        // console.log(code);

        // console.time('newFunc');
        var func = new Function("React", "components", ...placeholders, code);
        // console.timeEnd('newFunc');
        // console.log(func.toString());
        
        return func(React, components, ...value);
    }
}

// @ts-ignore
if (typeof module !== "undefined") {
    // @ts-ignore
    module.exports = {
        STATE,
        JSX_STATE,
        rules,
        Data,
        Context,
        JSXElement,
        jsx
    };
} else if (typeof window !== undefined) {
    // @ts-ignore
    window.litJSX = {
        STATE,
        JSX_STATE,
        rules,
        Data,
        Context,
        JSXElement,
        jsx
    };
}

}())