'use strict';
const _json = Symbol('#json');
const _error = Symbol('#error');
module.exports = exports = middleware;
exports.schema = schema;
exports._json = _json;
exports.time = {
    zone: "+0800",
    format: "YYYY-MM-DD HH:mm:ss",
};

const _ = require('lodash');
const moment = require('moment');

const DEBUG = process.env.DEBUGGER ? true : false;

function middleware(key, payload, routine) {
    if (!routine) throw Error("routine is required");
    return async function (ctx, next) {
        ctx[exports._json] = schema(key, payload, ctx.request.body);
        ctx[_error] = exports.errorHandler || function noop() {};
        ctx[_error] && ctx[_error].apply(this, arguments);
        if (DEBUG) {
            console.log("DEBUGGING =======");
            console.log(ctx[exports._json]);
            console.log("DEBUGGING =======");
        }
        await routine(ctx, next);
    };
}

function isType(typename, obj) {
    const plain = {
        'int': 'Number',
        'int!': 'Number',
        'string': 'String',
        'string!': 'String',
        'bool': 'Boolean',
        'bool!': 'Boolean',
        'array': 'Array',
        'array!': 'Array',
        'datetime': 'Date',
        'datetime!': 'Date',
    };
    let type = plain[typename.trim()];
    if (['int', 'int!'].includes(type) && Number.isNaN(obj)) {
        throw { message: 'NaN is not permit' };
    }
    return Object.prototype.toString.call(obj) === `[object ${type}]`;
}

function schema(key, payload, body) {
    let _plain = payload;
    try {
        if (!key)
            throw Error("key is required");
        if (!payload)
            throw Error("payload is required");
        _plain = _compile(_plain, body);
        if (typeof _plain !== 'object')
            throw Error("parser failuer checkout your payload");
    }
    catch(err) {
        if (DEBUG) {
            console.log("Error==========");
            console.log(err);
            console.log("Error==========");
        }
        throw { type: 'koa2-json-schema', err };
    }
    return _plain;
    function _compile(str, body) {
        let lex = _lexical(str);
        return _parser(str, lex, body);
    }

    function _validparentheses(str) {
        return str.replace(/[^\{\}]/g, '').replace(/\{\}/g, '') ? false : true;
    }

    function _lexical(str) {
        const patterns = {
            schema: /type([^{]*)([^}]*)/,
            fields: /(\S+):(.*)/g,
            properties: /([^:|;]*):\s+([^:|;]*)/g
        };
        let _statements = str.split(';');
        if (!_statements) throw Error("missing semicolon")
        _statements =  _statements.filter(_s => _s); // filter falsy
        let _result = {};
        while (_statements.length) {
            let char;
            var _cur = _statements[0];
            if (patterns.schema.test(_cur)) {
                if (!_validparentheses(_cur)) {
                    throw { origin: str, message: 'invalid parentheses' };
                }
                let _matcher = _cur.match(patterns.schema);
                let _type = _matcher[1].replace(/\s+/g, '');
                let _properties = _matcher[2];
                _result[_type] = {};
                _properties.match(patterns.fields).join(';')
                    .replace(patterns.properties,
                        (_, key, value) => {
                            _result[_type][key] = value;
                        }
                    );
            }
            _statements.shift();
        }
        return _result;
    }

    function handleDateType(obj) {
        return new moment(obj).utcOffset(exports.time.zone).format(exports.time.format);
    }

    function required({ val, name, type }) {
        if (![0, NaN, Infinity].includes(val) && !val) {
            this[name] = { reason: `params missing ${name}`, type: 'params missing' };
            return;
        }
        if (['datetime', 'datetime!'].includes(type) && val) return handleDateType(val);
        if (!isType(type, val)) {
            this[name] = { reason: `params ${name} value should be ${type}`, type: 'params types' };
            return;
        }
        return val;
    }

    function optional({ val, name, type }) {
        if (val && !isType(type, val)) {
            this[name] = { reason: `params ${name} value should be ${type}`, type: 'params types' };
            return;
        }
        if (type === '[object Date]' && obj) return handleDateType(val);
        return val;
    }

    function transformPlainType(type) {
        const patterns = {
            'string!': '[object String]',
            'string': '[object String]',
            'int!': '[object Number]',
            'int': '[object Number]',
            'bool!': '[object Boolean]',
            'bool': '[object Boolean]',
            'date!': '[object Date]',
            'date': '[object Date]',
            'array!': '[object Array]',
            'array': '[object Array]',
        };
        return patterns[type];
    }

    function _parser(plain, lexical, body) {
        if (typeof lexical !== 'object')
            throw { message: 'lexical should be a object' };
        let _result = { errors: {} };
        for (let field_name in lexical) {
            let _errs = {};
            _result[field_name] = _lexical[field_name] || {};
            for (let [key, type] of Object.entries(lexical[field_name])) {
                let val = _.get(body, `${field_name}.${key}`)
                _result[field_name][key] =
                    (type.slice(-1) === '!') ?
                            required.call(_errs, {val, name: key, type}) :
                            optional.call(_errs, {val, name: key, type});
            }
            if (Object.entries(_errs).length) _result.errors[field_name] = _errs;
        }
        if (DEBUG) {
            console.log("_parser========");
            console.log(_result);
            console.log("_parser========");
        }
        return _result;
    }
}
