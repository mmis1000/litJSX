// @ts-check

(function () {

    const id = (name) => Symbol(name)

    class Data {
        constructor(parent = null) {
            /** @type {Data} */
            this.parent = parent
        }
    }

    const STATE = {
        INIT: id('init'),
        LEAVE: id('leave'),
        SKIP_SPACE: id('skip_space'),
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

            /** @type {string} */
            this.str = str;
            /** @type {number} */
            this.ptr = 0;
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
            try {
                return this._run()
            } catch (err) {
                // error reports

                let lines = this.str.match(/[^\r\n]+\r?\n?/g);
                let ptr = this.ptr;
                let line = 0;
                let consumedChars = 0;
                let col = 0;

                while (consumedChars < ptr) {
                    let newConsumedChars = consumedChars + lines[line].length;

                    if (newConsumedChars >= ptr) {
                        col = ptr - consumedChars;
                        break;
                    }

                    consumedChars = newConsumedChars;
                    line++;
                }

                function dup(str, len) {
                    var res = '';
                    while (len-- > 0) {
                        res += str;
                    }
                    return res;
                }

                let newMessage = (
                    `at\n${lines[line]}\n` +
                    `${dup(' ', col)}^ at line ${line} col ${col}\n` +
                    err.message
                )

                let newError = new Error(newMessage);
                /** @type {any} */
                (newError).originalError = err;

                throw newError;
            }
        }

        _run() {
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

                if (this.stack[this.stack.length - 1] == null) {
                    this.finished = true;
                } else {
                    this.stack[this.stack.length - 1][this.state](this);
                }
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
            let ptr = this.ptr;

            // reset the regex to current position
            regex.lastIndex = this.ptr;

            let res = regex.exec(this.str);

            if (res && res.index >= this.ptr) {
                let position = res.index;
                let text = this.str.slice(ptr, position);
                this.ptr = position;
                return text;
            } else {
                return null;
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

        /**
         * whether it is end of string
         * @returns {boolean}
         */
        isEOS() {
            return this.ptr >= this.str.length;
        }
    }

    var regexs = {
        until_not_space: /[^\s\r\n]/g,
        until_tag: /<|$/g,
    }

    var JSX_STATE = Object.assign({}, STATE, {
        MATCH_TAG: id('match_tag'),
        TAG: {
            LEFT: {
                OPEN: id('open'),
                CLOSE: id('close'),
            },
            NAME: id('name'),
            ATTRIB: {
                SPREAD: id('spread'),
                NAME: id('name'),
                VALUE: id('value'),
            },
            RIGHT: {
                OPEN: id('open'),
                CLOSE: id('close'),
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
        constructor(name = "", attributes = {}, elements = [], parent = null) {
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
                elements: this.elements.map((el => typeof el === "string" ? el : el.toJSON())),
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
     * @property {function():JSXElement} getTop
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
        [JSX_STATE.INIT]( /** @type {Context} */ context) {
            var data = /** @type {RootData} */ ( /** @type {any} */ (context.data));

            if (!data.initilized) {
                data.initilized = true;
                data.tree = new JSXElement("__Fragment__");
                data.stack = [data.tree];

                data.getTop = () => {
                    return data.stack[data.stack.length - 1]
                }

                data.addAndEnter = function (name, attributes, mixins, elements) {
                    var newElement = new JSXElement(name, attributes, elements, data.getTop());
                    newElement.attributeMixins = mixins || [];
                    data.getTop().append(newElement);
                    data.stack.push(newElement);
                }

                data.add = function (name, attributes, mixins, elements) {
                    var newElement = new JSXElement(name, attributes, elements, data.getTop());
                    newElement.attributeMixins = mixins || [];
                    data.getTop().append(newElement);
                }

                data.leave = function () {
                    data.stack.pop();
                }
            }

            if (context.isEOS()) {
                context.state = JSX_STATE.LEAVE;
                if (data.stack.length !== 1) {
                    throw new Error('unclosed tags ' + data.stack.slice(1).map((t) => `<${t.name}>`).join(""))
                }
            } else {
                context.state = JSX_STATE.SKIP_SPACE;
            }
        },
        [JSX_STATE.SKIP_SPACE]( /** @type {Context} */ context) {
            context.walk(regexs.until_not_space)
            context.state = JSX_STATE.MATCH_TAG;
        },
        [JSX_STATE.MATCH_TAG]( /** @type {Context} */ context) {
            if (context.expect(/^</)) {
                // it is a tag
                context.state = this.TAG;
            } else {
                // it is a piece of text
                context.state = this.TEXT;
            }
        },
        TAG: {
            [JSX_STATE.INIT]( /** @type {Context} */ context) {
                var data = /** @type {TagData} */ ( /** @type {any} */ (context.data));

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
                        if ((data.name || "__Fragment__") !== data.parent.getTop().name) {
                            throw new Error(`wat? <${data.parent.getTop().name}></${data.name}>`)
                        }
                        data.parent.leave();
                    } else if (data.right === "close") {
                        if (!data.name) {
                            throw new Error("you can't write a self close fragment!")
                        }
                        // self close tag
                        data.parent.add(data.name, data.attributes, data.attributeMixins, []);
                    } else {
                        // a both end open tag
                        data.parent.addAndEnter(data.name || '__Fragment__', data.attributes, data.attributeMixins, []);
                    }

                    context.state = JSX_STATE.LEAVE;
                    return;
                }

            },
            LEFT: {
                [JSX_STATE.INIT]( /** @type {Context} */ context) {
                    var data = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

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
            [JSX_STATE.TAG.NAME]( /** @type {Context} */ context) {
                context.walk(regexs.until_not_space);
                var name = context.walk(/(\s|\/?>)/g)
                var data = /** @type {TagData} */ ( /** @type {any} */ (context.data));
                data.name = name;

                context.state = STATE.INIT;
            },
            ATTRIB: {
                [JSX_STATE.INIT]( /** @type {Context} */ context) {
                    context.walk(regexs.until_not_space);

                    if (context.expect(/^\/?>/)) {
                        // right tag
                        context.state = STATE.LEAVE;
                    } else if (context.expect(/^\.\.\.\S/)) {
                        context.state = JSX_STATE.TAG.ATTRIB.SPREAD;
                    } else {
                        context.state = JSX_STATE.TAG.ATTRIB.NAME;
                    }
                },
                [JSX_STATE.TAG.ATTRIB.SPREAD]( /** @type {Context} */ context) {
                    // remove ...
                    context.ptr += 3;
                    var text = context.walk(/(\s|\r|\n|\/?>)/g)
                    var parentData = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

                    parentData.attributeMixins.push(text);
                    context.state = JSX_STATE.INIT;
                },
                [JSX_STATE.TAG.ATTRIB.NAME]( /** @type {Context} */ context) {
                    var text = context.walk(/(=|\s|\/?>)/g);

                    var data = /** @type {AttributeData} */ ( /** @type {any} */ (context.data));
                    var parentData = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

                    if (text.length === 0) {
                        throw new Error('attribute without name')
                    } else if (context.expect(/^=\S/)) {
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
                [JSX_STATE.TAG.ATTRIB.VALUE]( /** @type {Context} */ context) {
                    if (context.expect(/^'/)) {
                        context.ptr++;
                        var text = context.walk(/'/g);
                        context.ptr++;
                    } else if (context.expect(/^"/)) {
                        context.ptr++;
                        var text = context.walk(/"/g);
                        context.ptr++;
                    } else {
                        var text = context.walk(/(\s|\/?>)/g);
                    }
                    var data = /** @type {AttributeData} */ ( /** @type {any} */ (context.data));
                    var parentData = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

                    parentData.attributes[data.name] = text;
                    context.state = STATE.INIT;
                }
            },
            RIGHT: {
                [JSX_STATE.INIT]( /** @type {Context} */ context) {
                    var data = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

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
            [JSX_STATE.INIT]( /** @type {Context} */ context) {
                var text = context.walk(regexs.until_tag);

                if (text == null) {
                    throw new Error('unknown state, how should I enter here?')
                }

                var data = /** @type {RootData} */ ( /** @type {any} */ (context.data.parent));

                if (text.match(/[^\s\r\n]/)) {
                    data.getTop().elements.push(text.replace(/[\s|\r|\n]+$/, ''));
                }

                context.state = JSX_STATE.LEAVE;
            }
        }
    }

    /**
     * @typedef {any} templeteFunction
     */

    /**
     * @type {WeakMap<string[], templeteFunction>}
     */
    var cache = new WeakMap();

    /**
     * 
     * @param {string} unsafe 
     * @returns {string}
     */
    function unescapeHtml(unsafe) {
        return unsafe
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, "\u00A0")
            .replace(/&amp;/g, "&");
    }

    /**
     * 
     * @param {{createElement: function(any,any,any):any}} React 
     * @param {Object<string, {createElement: function(any,any,any):any}>} components 
     */
    function jsx(React, components) {

        /**
         * @param {string[]} strings
         * @param {any} value
         */
        return function (strings, ...value) {
            if (cache.has(strings)) {
                return cache.get(strings)(React, components, ...value);
            }

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
            var tree = /** @type {any}*/ (walker.run()).tree;
            // console.timeEnd('parse');

            if (tree.elements.length === 1 && typeof tree.elements[0] !== "string") {
                // unwrap fragment that only has one child
                tree = tree.elements[0]
            }

            /**
             * 
             * @param {JSXElement} dom 
             */
            function codegen(dom) {
                function mapToPropertyString(node, key) {
                    var prop = ''

                    if (key.match(placeholderRegex)) {
                        // placeholder in key cl${"s"}s=test
                        prop += '[' + JSON.stringify(key).replace(placeholderRegex, function (match) {
                            return '"+' + match + '+"'
                        }) + ']';
                    } else {
                        prop += JSON.stringify(key);
                    }

                    prop += ':'

                    var value = node.attributes[key];

                    var res = value.match(placeholderRegex);

                    if (res) {
                        if (res[0] === value) {
                            // a full match var=${"val"}
                            prop += res[0];
                        } else {
                            // a parital match var=a{"val"}
                            prop += JSON.stringify(value).replace(placeholderRegex, function (match) {
                                return '"+' + match + '+"'
                            })
                        }
                    } else {
                        prop += JSON.stringify(value);
                    }

                    return prop;
                }


                /**
                 * 
                 * @param {JSXElement} node 
                 */
                function gen(node) {
                    if (typeof node === 'string') {
                        return JSON.stringify(unescapeHtml(node)).replace(placeholderRegex, function (match) {
                            return '" , ' + match + ' , "'
                        });
                    } else {
                        return `React.createElement(${
                            node.name == '__Fragment__' ?
                            'React.Fragment':
                            components[node.name] !== undefined ?
                            'components.' + node.name:
                            JSON.stringify(node.name)

                        }, ${
                            node.attributeMixins.length > 0?
                            'Object.assign({}, {' + 
                                Object.keys(node.attributes).map((key)=>{
                                    return mapToPropertyString(node, key);
                                }).join(',\n') + 
                            '},' + node.attributeMixins.map(function (str) {
                                if (!str.match(placeholderRegex)) {
                                    throw new Error('cannot expand a string ' + str)
                                } else {
                                    return str.match(placeholderRegex)[0];
                                }
                            }).join(',') + ')': // apply mixins
                            Object.keys(node.attributes).length > 0?
                            '{' + 
                            Object.keys(node.attributes).map((key)=>{
                                return mapToPropertyString(node, key);
                            }).join(',') + 
                        '}': // property only
                            'null'
                        },${ 
                            node.elements.map(gen).join(",")
                        })`
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

            cache.set(strings, func);

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
            cache,
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