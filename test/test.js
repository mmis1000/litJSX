var litJSX = require('../');
var chai = require('chai');
var assert = chai.assert;

var jsx = litJSX.jsx;
var parse = function (str) {
    var walker = new litJSX.Context(litJSX.rules, str);
    var tree = /** @type {any}*/ (walker.run()).tree;
    return tree;
}

describe('Parser', function () {
    it('should parse <>123</>', function () {
        var tree = parse('<>123</>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "__Fragment__",
                "attributeMixins": [],
                "attributes": {},
                "elements": [
                    "123"
                ]
            }],
            "attributeMixins": []
        })
    });
    it('should parse 123', function () {
        var tree = parse('123');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [
                "123"
            ],
            "attributeMixins": []
        })
    });
    it('should parse <tag/>', function () {
        var tree = parse('<tag/>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {},
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag></tag>', function () {
        var tree = parse('<tag></tag>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {},
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })

    });
    it('should parse <tag>123</tag>', function () {
        var tree = parse('<tag>123</tag>');

        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {},
                "elements": [
                    "123"
                ],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })

    });
    it('should parse <tag><tag/></tag>', function () {
        var tree = parse('<tag><tag/></tag>')
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {},
                "elements": [{
                    "name": "tag",
                    "attributes": {},
                    "elements": [],
                    "attributeMixins": []
                }],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag><tag/><tag/></tag>', function () {
        var tree = parse('<tag><tag/><tag/></tag>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {},
                "elements": [{
                        "name": "tag",
                        "attributes": {},
                        "elements": [],
                        "attributeMixins": []
                    },
                    {
                        "name": "tag",
                        "attributes": {},
                        "elements": [],
                        "attributeMixins": []
                    }
                ],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag test/>', function () {
        var tree = parse('<tag test/>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {
                    "test": ""
                },
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag test= />', function () {
        var tree = parse('<tag test= />');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {
                    "test": ""
                },
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag test=123/>', function () {
        var tree = parse('<tag test=123/>')
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {
                    "test": "123"
                },
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag test=\'123\'/>', function () {
        var tree = parse('<tag test=\'123\'/>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {
                    "test": "123"
                },
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })

    });
    it('should parse <tag test="123"/>', function () {
        var tree = parse('<tag test="123"/>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {
                    "test": "123"
                },
                "elements": [],
                "attributeMixins": []
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag ...test/>', function () {
        var tree = parse('<tag ...test/>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                "name": "tag",
                "attributes": {},
                "elements": [],
                "attributeMixins": [
                    "test"
                ]
            }],
            "attributeMixins": []
        })
    });
    it('should parse <tag ...test test1=123 test2="456" test3=\'567\'>content</tag><tag/>', function () {
        var tree = parse('<tag ...test test1=123 test2="456" test3=\'567\'>content</tag><tag/>');
        assert.deepEqual(tree.toJSON(), {
            "name": "__Fragment__",
            "attributes": {},
            "elements": [{
                    "name": "tag",
                    "attributes": {
                        "test1": "123",
                        "test2": "456",
                        "test3": "567"
                    },
                    "elements": [
                        "content"
                    ],
                    "attributeMixins": [
                        "test"
                    ]
                },
                {
                    "name": "tag",
                    "attributes": {},
                    "elements": [],
                    "attributeMixins": []
                }
            ],
            "attributeMixins": []
        })
    });
    it('parse a 10000 tags template first time', function () {
        var template = "";
        for (let i = 0; i < 10000; i++) {
            if (Math.random() > 0.33) {
                template += "<tag/>"
            } else if (Math.random() > 0.5) {
                template += "<tag>only text here</tag>"
            } else {
                template += "<tag ...t0 t1 t2=t3 t4=/>"
            }
        }
        var res = parse(template)
        assert.equal(res.elements.length, 10000);
    });
    it('parse a 10000 tags template second time', function () {
        var template = "";
        for (let i = 0; i < 10000; i++) {
            if (Math.random() > 0.33) {
                template += "<tag/>"
            } else if (Math.random() > 0.5) {
                template += "<tag>only text here</tag>"
            } else {
                template += "<tag ...t0 t1 t2=t3 t4=/>"
            }
        }
        var res = parse(template)
        assert.equal(res.elements.length, 10000);
    });
    it('parse a l0000 tags with long text template', function () {
        var template = "";
        for (let i = 0; i < 10000; i++) {
            template += "<tag>"

            for (let j = 0; j < 100; j++) {
                template += "only text here "
            }

            template +="</tag>"
        }
        var res = parse(template)
        assert.equal(res.elements.length, 10000);
    });
    it('throws on <tag>', function () {
        assert.throws(function () {
            parse('<tag>')
        }, /unclosed tags/)
    })
    it('throws on <tag></tag2>', function () {
        assert.throws(function () {
            parse('<tag></tag2>')
        }, /unmateched tags/)
    })
    it('throws on <tag>\\n</tag2>', function () {
        assert.throws(function () {
            parse('<tag>\n</tag2>')
        }, /unmateched tags/)
    })
    it('throws on </tag/>', function () {
        assert.throws(function () {
            parse('</tag/>')
        }, /both end closed tag/)
    })
    it('throws on </ />', function () {
        assert.throws(function () {
            parse('</ />')
        }, /both end closed tag/)
    })
    it('throws on < />', function () {
        assert.throws(function () {
            parse('< />')
        }, /self close fragment/)
    })
    it('throws on <tag =val/>', function () {
        assert.throws(function () {
            parse('<tag =val/>')
        }, /attribute without name/)
    })
    it('throws on <tag></tag attr >', function () {
        assert.throws(function () {
            parse('<tag></tag attr >')
        }, /close tag can't has attribute/)
    })
});

function ReactMock() {
    var res = {};
    res.id = 0;
    res.arguments = [];
    res.Fragment = "<Fragment>";
    res.createElement = function (name, attributes, ...children) {
        res.arguments.push({
            name,
            attributes,
            children
        })
        return res.id++;
    }

    return res;
}

describe('JSX', function () {
    it('should parse <Tag/>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag/>
        `

        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": null,
                "children": []
            }]
        )
    });
    it('should parse <Tag>${"123"}</Tag>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag>${"123"}</Tag>
        `

        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": null,
                "children": [
                    "",
                    "123",
                    ""
                ]
            }]
        )
    });
    it('should parse <Tag val=${47}/>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag  val=${47}/>
        `
        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": {
                    "val": 47
                },
                "children": []
            }]
        )
    });
    it('should parse <Tag ${"val"}=test/>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag ${"val"}=test/>
        `
        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": {
                    "val": "test"
                },
                "children": []
            }]
        )
    });
    it('should parse <Tag v${"a"}l=t${"es"}t/>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag v${"a"}l=t${"es"}t/>
        `
        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": {
                    "val": "test"
                },
                "children": []
            }]
        )
    });
    it('should parse <Tag ...${{test:"included"}} val=t${"es"}t val1=${"test1"} v${"a"}l2=test2/>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag ...${{test:"included"}}  val=t${"es"}t val1=${"test1"} v${"a"}l2=test2/>
        `
        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": {
                    "val": "test",
                    "val1": "test1",
                    "val2": "test2",
                    "test": "included"
                },
                "children": []
            }]
        )
    });
    it('should parse <Tag><div></div></Tag>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag><div></div></Tag>
        `
        assert.deepEqual(
            mock.arguments, [{
                    "name": "div",
                    "attributes": null,
                    "children": []
                },
                {
                    "name": "<Tag>",
                    "attributes": null,
                    "children": [
                        0
                    ]
                }
            ]
        )
    });
    it('should parse <Tag></Tag><div></div>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag></Tag>
            <div></div>
        `
        assert.deepEqual(
            mock.arguments, [{
                    name: '<Tag>',
                    attributes: null,
                    children: []
                },
                {
                    name: 'div',
                    attributes: null,
                    children: []
                },
                {
                    name: '<Fragment>',
                    attributes: null,
                    children: [0, 1]
                }
            ]
        )
    });
    it('should parse 123', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            123
        `
        assert.deepEqual(
            mock.arguments, [{
                name: '<Fragment>',
                attributes: null,
                children: ['123']
            }]
        )
    });
    it('should parse <Tag>123</Tag>', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag>123</Tag>
        `
        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": null,
                "children": [
                    "123"
                ]
            }]
        )
    });
    it('unescape entities in body if there are', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            &amp;lt; &lt;&gt;&quot;&#039;&nbsp;
        `

        assert.deepEqual(
            mock.arguments, [{
                "name": "<Fragment>",
                "attributes": null,
                "children": [
                    "&lt; <>\"'\u00A0"
                ]
            }]
        )
    });
    it('unescape entities in plain attributes if there are', function () {
        var mock = ReactMock();
        jsx(mock, {
            Tag: "<Tag>"
        })
        `
            <Tag val="&amp;lt; &lt;&gt;&quot;&#039;&nbsp;"></Tag>
        `

        assert.deepEqual(
            mock.arguments, [{
                "name": "<Tag>",
                "attributes": {
                    val: "&lt; <>\"'\u00A0"
                },
                "children": []
            }]
        )
    });
    it('parse and run a 10000 tags templete', function () {
        var template = "";
        for (let i = 0; i < 10000; i++) {
            if (Math.random() > 0.33) {
                template += "<tag/>"
            } else if (Math.random() > 0.5) {
                template += "<tag>only text here</tag>"
            } else {
                template += "<tag t1 t2=t3 t4=/>"
            }
        }
        var mock = ReactMock();

        var res = jsx(mock, {
            Tag: "<Tag>"
        })([template]);

        assert.equal(mock.arguments.length, 10001)
    });
    it('parse and rerun a 10000 tags templete for 100 times (cache test)', function () {
        var template = "";
        for (let i = 0; i < 10000; i++) {
            if (Math.random() > 0.33) {
                template += "<tag/>"
            } else if (Math.random() > 0.5) {
                template += "<tag>only text here</tag>"
            } else {
                template += "<tag t1 t2=t3 t4=/>"
            }
        }

        var strings = [template]

        for (let i = 0; i < 100; i++) {
            var mock = ReactMock();
            var res = jsx(mock, {Tag: "<Tag>"})(strings);
        }
    });
    it('throws on <Tag ...test/>', function () {
        var mock = ReactMock();
        assert.throws(function (){
            jsx(mock, {
                Tag: "<Tag>"
            })
            `
                <Tag ...test/>
            `
        }, /cannot expand a string test/)
    });
    it('throws on <Tag ...test${{}}/>', function () {
        var mock = ReactMock();
        assert.throws(function (){
            jsx(mock, {
                Tag: "<Tag>"
            })
            `
                <Tag ...test${{}}/>
            `
        }, /cannot expand a string/)
    });
})