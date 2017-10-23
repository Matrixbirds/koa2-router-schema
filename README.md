# Invest Graphql Like Router Schema  

## version 0.0.1  

## Usage  

```javascript
'use strict';

const expose = Object.assign;

const koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const app = new koa();

const schema = require('koa2-router-schema');

const _json = schema._json;

const router = require('koa-router')();

const payload = require('./_params-schema');

router.post('/login', schema('request', 
     `
        type data {
            name: string!
            password: string!
            datetime: datetime!
        };
    `,
    async function(ctx, next) {
        let len = Object.entries(ctx[_json].errors).length;
        ctx.status = len ? 400 : 200;
        ctx.body = { data: ctx[_json].data, errors: ctx[_json].errors };
      }
));

app.use(bodyParser());
app.use(router.routes());

module.exports = app;
```
