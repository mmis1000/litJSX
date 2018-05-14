// @ts-check

(function () {

    const id = (name) => Symbol(name)

    class Data {
        constructor(parent = null) {
            /** 
             * the parent data container
             * @type {Data} 
             */
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
            /** 
             * the initial rule set
             * @type {Rule} 
             */
            this.rule = rule;
            /** 
             * the data container
             * @type {Data} 
             */
            this.data = new Data;
            /** 
             * whether the state machine is terminated
             * @type {boolean} 
             */
            this.finished = false;
            /** 
             * next state of current state michine to run
             * @type {Rule|symbol} 
             */
            this.state = STATE.INIT
            /**
             * the rule set currently used
             * @type {Rule[]} 
             */
            this.stack = [];
            /** 
             * text to parse
             * @type {string} 
             */
            this.str = str;
            /** 
             * current pointer position
             * @type {number} 
             */
            this.ptr = 0;
        }

        /**
         * push new data container to stack
         */
        enter() {
            this.data = new Data(this.data);
        }

        /**
         * pop the data stack
         */
        leave() {
            if (this.data.parent != null) {
                this.data = this.data.parent;
            } else {
                this.finished = true;
                return;
            }
        }

        /**
         * wrapper for _run to print better error message
         * @returns {Data}
         */
        run() {
            try {
                return this._run()
            } catch (err) {
                // error reports

                const lines = this.str.match(/[^\r\n]+\r?\n?/g);
                const ptr = this.ptr;
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

                /**
                 * dup the str for num times
                 * @param {string} str 
                 * @param {number} len 
                 * @returns {string}
                 */
                function dup(str, len) {
                    let res = '';
                    while (len-- > 0) {
                        res += str;
                    }
                    return res;
                }

                const newMessage = (
                    `${lines[line]}\n` +
                    `${dup(' ', col)}^ at line ${line + 1} col ${col}\n` +
                    dup(' ', col + 2) + err.message
                )

                const newError = new Error(newMessage);
                /** @type {any} */
                (newError).originalError = err;

                throw newError;
            }
        }

        /**
         * run the machine and get the result
         * @returns {Data}
         */
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
            const ptr = this.ptr;

            // reset the regex to current position
            regex.lastIndex = this.ptr;

            const res = regex.exec(this.str);

            if (res && res.index >= this.ptr) {
                const position = res.index;
                const text = this.str.slice(ptr, position);
                this.ptr = position;
                return text;
            } else {
                return null;
            }
        }

        /**
         * test whether current position match specifiec regex
         * @param {RegExp} regex 
         * @returns {boolean}
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

    const regexs = {
        until_not_space: /[^\s\r\n]/g,
        until_tag: /<|$/g,
    }

    const JSX_STATE = Object.assign({}, STATE, {
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
            /** 
             * the tag name '__Fagment__' if it is a jsx fragment
             * @type {string} 
             */
            this.name = name;
            /** 
             * properties of this tag
             * @type {Object<string, string>} 
             */
            this.attributes = attributes;
            /** 
             * list of ...mixins
             * @type {string[]} 
             */
            this.attributeMixins = [];
            /** 
             * children og this element
             * @type {(JSXElement|string)[]} 
             */
            this.elements = elements;
            /** 
             * parent element
             * @type {JSXElement} 
             */
            this.parent = parent;
        }

        /**
         * 
         * @param {JSXElement} element 
         */
        append(element) {
            this.elements.push(element);
        }

        /**
         * serialize
         * @returns {Object}
         */
        toJSON() {
            // remove parent from property or the serialize will fail
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
     * @property {function():JSXElement} peak
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
    const rules = {
        [JSX_STATE.INIT]( /** @type {Context} */ context) {
            const data = /** @type {RootData} */ ( /** @type {any} */ (context.data));

            if (!data.initilized) {
                data.initilized = true;
                data.tree = new JSXElement("__Fragment__");
                data.stack = [data.tree];

                data.peak = () => {
                    return data.stack[data.stack.length - 1]
                }

                data.addAndEnter = (name, attributes, mixins, elements) => {
                    const newElement = new JSXElement(name, attributes, elements, data.peak());
                    newElement.attributeMixins = mixins || [];
                    data.peak().append(newElement);
                    data.stack.push(newElement);
                }

                data.add = (name, attributes, mixins, elements) => {
                    const newElement = new JSXElement(name, attributes, elements, data.peak());
                    newElement.attributeMixins = mixins || [];
                    data.peak().append(newElement);
                }

                data.leave = () => {
                    data.stack.pop();
                }
            }

            if (context.isEOS()) {
                context.state = JSX_STATE.LEAVE;
                if (data.stack.length !== 1) {
                    throw new SyntaxError('unclosed tags ' + data.stack.slice(1).map((t) => `<${t.name}>`).join(""))
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
                const data = /** @type {TagData} */ ( /** @type {any} */ (context.data));

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
                        throw new SyntaxError('both end closed tag');
                    } else if (data.left === "close") {
                        if (Object.keys(data.attributes).length > 0) {
                            throw new SyntaxError("close tag can't has attribute");
                        }

                        // check if the tag matches
                        if ((data.name || "__Fragment__") !== data.parent.peak().name) {
                            throw new SyntaxError(`unmateched tags <${data.parent.peak().name}></${data.name}>`)
                        }
                        data.parent.leave();
                    } else if (data.right === "close") {
                        if (!data.name) {
                            throw new SyntaxError("you can't write a self close fragment!")
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
                    const data = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

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
                const name = context.walk(/(\s|\/?>)/g)
                const data = /** @type {TagData} */ ( /** @type {any} */ (context.data));
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
                    const text = context.walk(/(\s|\r|\n|\/?>)/g)
                    const parentData = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

                    parentData.attributeMixins.push(text);
                    context.state = JSX_STATE.INIT;
                },
                [JSX_STATE.TAG.ATTRIB.NAME]( /** @type {Context} */ context) {
                    const text = context.walk(/(=|\s|\/?>)/g);

                    const data = /** @type {AttributeData} */ ( /** @type {any} */ (context.data));
                    const parentData = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

                    if (text.length === 0) {
                        throw new SyntaxError('attribute without name')
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
                    /**
                     * @type {string}
                     */
                    let text;
                    if (context.expect(/^'/)) {
                        context.ptr++;
                        text = context.walk(/'/g);
                        context.ptr++;
                    } else if (context.expect(/^"/)) {
                        context.ptr++;
                        text = context.walk(/"/g);
                        context.ptr++;
                    } else {
                        text = context.walk(/(\s|\/?>)/g);
                    }
                    const data = /** @type {AttributeData} */ ( /** @type {any} */ (context.data));
                    const parentData = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

                    parentData.attributes[data.name] = text;
                    context.state = STATE.INIT;
                }
            },
            RIGHT: {
                [JSX_STATE.INIT]( /** @type {Context} */ context) {
                    const data = /** @type {TagData} */ ( /** @type {any} */ (context.data.parent));

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
                const text = context.walk(regexs.until_tag);

                if (text == null) {
                    throw new Error('unknown state, how should I enter here?')
                }

                const data = /** @type {RootData} */ ( /** @type {any} */ (context.data.parent));

                if (text.match(/[^\s\r\n]/)) {
                    data.peak().elements.push(text.replace(/[\s|\r|\n]+$/, ''));
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
    const cache = new WeakMap();

    /**
     * unescape some common html entity subset
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
     * create the tag templete function
     * @param {{createElement: function(any,any,any):any}} React 
     * @param {Object<string, {createElement: function(any,any,any):any}>} components 
     */
    function jsx(React, components) {

        /**
         * the template function
         * @param {string[]} strings
         * @param {...any} value
         * @returns {any} the jsx element
         */
        return function templete(strings, ...value) {
            if (cache.has(strings)) {
                return cache.get(strings)(React, components, ...value);
            }

            const placeholders = []
            let joined = "";
            const rand = Math.random().toString(16).slice(2, 10)

            for (let i = 0; i < strings.length; i++) {
                if (i > 0) {
                    joined += `$place_${rand}_${i - 1}$`;
                    placeholders.push(`$place_${rand}_${i - 1}$`)
                }
                joined += strings[i];
            }

            const placeholderRegex = new RegExp(`\\$place_${rand}_\\d+\\$`, "g");
            const walker = new Context(rules, joined);

            // console.time('parse');
            let tree = /** @type {any}*/ (walker.run()).tree;
            // console.timeEnd('parse');

            if (tree.elements.length === 1 && typeof tree.elements[0] !== "string") {
                // unwrap fragment that only has one child
                tree = tree.elements[0]
            }

            /**
             * generate the js function source for the whole dom
             * @param {JSXElement} dom 
             * @returns {string}
             */
            function codegen(dom) {

                /**
                 * generate source for given property
                 * @param {JSXElement} node 
                 * @param {string} key 
                 * @returns {string}
                 */
                function mapToPropertyString(node, key) {
                    let prop = ''

                    if (key.match(placeholderRegex)) {
                        // placeholder in key cl${"s"}s=test
                        prop += '[' + JSON.stringify(key).replace(placeholderRegex, function (match) {
                            return '"+' + match + '+"'
                        }) + ']';
                    } else {
                        prop += JSON.stringify(key);
                    }

                    prop += ':'

                    const value = node.attributes[key];

                    const res = value.match(placeholderRegex);

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
                 * generate the js function source for given node
                 * @param {JSXElement} node 
                 * @returns {string}
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

            const code = codegen(tree);

            const func = new Function("React", "components", ...placeholders, code);

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