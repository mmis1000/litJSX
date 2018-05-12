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
    it('parse a 10000 tags templete', function () {
        var tempelete = "";
        for (let i = 0; i < 10000; i++) {
            if (Math.random() > 0.33) {
                tempelete += "<tag/>"
            } else if (Math.random() > 0.5) {
                tempelete += "<tag>only text here</tag>"
            } else {
                tempelete += "<tag ...t0 t1 t2=t3 t4=/>"
            }
        }
        parse(tempelete)
    });
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
    it('unescape entities if there are', function () {
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
})