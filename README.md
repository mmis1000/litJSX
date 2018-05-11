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
var templeteFunction = litJSX.jsx(React, {Component1, Component1, ...other});
```

```js
/**
 * @param {any[]} any
 * @returns {Element} react element
 */
templeteFunction;
```

# Basic Usage
```js
// it will return the element if there is only one root element
templeteFunction`
    <div></div>
`

// it will return a React.Fragment if there are more than one root element.
templeteFunction`
    <div></div>
    <div></div>
`
```

# Supported Syntaxs

## self closed tag
```js
templeteFunction`
    <div/>
`
```

## open tag
```js
templeteFunction`
    <div>content</div>
`
```

## text only (will be wrapped into a fragment)
```js
templeteFunction`
    There is only text
`
```

## fragment (although there is no reason to use it. It is automatically wrapped if there is more than one element at root)
```js
templeteFunction`
    <>
        There is only text
    </>
`
```

## props
```js
templeteFunction`
    <div attribute=x/>
    <div attribute='x'/>
    <div attribute="x"/>
`
```

## data in body
```js
templeteFunction`
    <div>
        The data here can also be
        ${"text"}
        or
        ${templeteFunction`another element`}
        or
        ${[templeteFunction`array of elements`]}
        just like original jsx
    </div>
`
```

## data in key (will be stringfied and concat to other part)
```js
templeteFunction`
    <div ${"key"}="value"/>
`
```

## only data in value (will not be stringfied)
```js
templeteFunction`
    <div key=${12}/>
`
```

## mixed data in value (will be stringfied and concat to other part)
```js
templeteFunction`
    <div key=${"val"}ue/>
`
```

## Object literal spread (will be mixed into the props by Object.assign)
```js
var ObjectToSpread = {key: "value"};
templeteFunction`
    <div ...${ObjectToSpread}/>
`
```