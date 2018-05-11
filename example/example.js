// @ts-check
// @ts-ignore
var jsx = require('../index.js').jsx;

function main() {
    console.time('all');
    jsx({createElement(){}}, {Container: null, Item: null})`
        <Container>
            <Item/>
            <Item data=${"123"} ...${{val: '123'}} disabled cla${"s"}s="bra${"infu"}ck" data1=${"test"}/>
            <Item data=${"123"}/>
        </Container>
        <div>test ${"world"}</div>
    `;
    console.timeEnd('all');
}

for (let i = 0; i < 100; i++) {
    main()
}
