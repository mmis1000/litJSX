# [WIP] litJSX

A 10kb(minified) only JSX compiler running in browser  
Write React without tool chains!

# Example
```js        
var res = litJSX.jsx(React, {Tag: Tag})`
    <Tag ...${{test:"included"}}  v${"a"}l=t${"es"}t val1=t${"es"}t1 v${"a"}l2=test2/>
`

ReactDOM.render(
    res,
    document.getElementById('root')
);
```

# API

```js
/**
 * @param {React} React
 * @param {Object<string, Componenet>} componenets the templete will try to create element as string directly if it is not registerd here
 * @returns {function} The templete literal function
 */
var jsx = litJSX.jsx(React, {Component1, Component1, ...other});
```

```js
/**
 * @param {string[]} templete
 * @param {...any} argumenets
 * @returns {Element} react element
 */
jsx;
```

# Basic Usage
```js
// it will return the element if there is only one root element
jsx`
    <div></div>
`

// it will return a React.Fragment if there are more than one root element.
jsx`
    <div></div>
    <div></div>
`
```

# Supported Syntaxs

## common entities
```js
// it unesacpe only these entities in tag body and attribute value
jsx`
    <div value="&amp;&lt;&gt;&quot;&#039;&nbsp;">
        &amp;&lt;&gt;&quot;&#039;&nbsp;
    </div>
`
// you got &<>"'\u00A0 in both property and body
```
## self closed tag
```js
jsx`
    <div/>
`
```

## open tag
```js
jsx`
    <div>content</div>
`
```

## text only (will be wrapped into a fragment)
```js
jsx`
    There is only text
`
```

## fragment (although there is no reason to use it. It is automatically wrapped if there is more than one element at root)
```js
jsx`
    <>
        There is only text
    </>
`
```

## props
```js
jsx`
    <div attribute=x/>
    <div attribute='x'/>
    <div attribute="x"/>
`
```

## data in body
```js
jsx`
    <div>
        The data here can also be
        ${"text"}
        or
        ${jsx`another element`}
        or
        ${[jsx`array of elements`]}
        just like original jsx
    </div>
`
```

## data in key (will be stringfied and concat to other part)
```js
jsx`
    <div ${"key"}="value"/>
`
```

## only data in value (will not be stringfied)
```js
jsx`
    <div key=${12}/>
`
```

## mixed data in value (will be stringfied and concat to other part)
```js
jsx`
    <div key=${"val"}ue/>
`
```

## Object literal spread (will be mixed into the props by Object.assign)
```js
var ObjectToSpread = {key: "value"};
jsx`
    <div ...${ObjectToSpread}/>
`
```