
let wasm;
function inRange(a,b,c){return b<=a&&a<=c}function includes(a,b){return a.indexOf(b)!==-1}var floor=Math.floor;function ToDictionary(o){if(o===undefined)return{};if(o===Object(o))return o;throw TypeError('Could not convert argument to dictionary');}function stringToCodePoints(e){var s=String(e);var n=s.length;var i=0;var u=[];while(i<n){var c=s.charCodeAt(i);if(c<0xD800||c>0xDFFF){u.push(c)}else if(0xDC00<=c&&c<=0xDFFF){u.push(0xFFFD)}else if(0xD800<=c&&c<=0xDBFF){if(i===n-1){u.push(0xFFFD)}else{var d=s.charCodeAt(i+1);if(0xDC00<=d&&d<=0xDFFF){var a=c&0x3FF;var b=d&0x3FF;u.push(0x10000+(a<<10)+b);i+=1}else{u.push(0xFFFD)}}}i+=1}return u}function codePointsToString(a){var s='';for(var i=0;i<a.length;++i){var b=a[i];if(b<=0xFFFF){s+=String.fromCharCode(b)}else{b-=0x10000;s+=String.fromCharCode((b>>10)+0xD800,(b&0x3FF)+0xDC00)}}return s}function isASCIIByte(a){return 0x00<=a&&a<=0x7F}var isASCIICodePoint=isASCIIByte;var end_of_stream=-1;function Stream(a){this.tokens=[].slice.call(a);this.tokens.reverse()}Stream.prototype={endOfStream:function(){return!this.tokens.length},read:function(){if(!this.tokens.length)return end_of_stream;return this.tokens.pop()},prepend:function(a){if(Array.isArray(a)){var b=(a);while(b.length)this.tokens.push(b.pop())}else{this.tokens.push(a)}},push:function(a){if(Array.isArray(a)){var b=(a);while(b.length)this.tokens.unshift(b.shift())}else{this.tokens.unshift(a)}}};var finished=-1;function decoderError(a,b){if(a)throw TypeError('Decoder error');return b||0xFFFD}function encoderError(a){throw TypeError('The code point '+a+' could not be encoded.');}function Decoder(){}Decoder.prototype={handler:function(a,b){}};function Encoder(){}Encoder.prototype={handler:function(a,b){}};function getEncoding(a){a=String(a).trim().toLowerCase();if(Object.prototype.hasOwnProperty.call(label_to_encoding,a)){return label_to_encoding[a]}return null}var encodings=[{"encodings":[{"labels":["unicode-1-1-utf-8","utf-8","utf8"],"name":"UTF-8"}],"heading":"The Encoding"},];var label_to_encoding={};encodings.forEach(function(c){c.encodings.forEach(function(b){b.labels.forEach(function(a){label_to_encoding[a]=b})})});var encoders={};var decoders={};function indexCodePointFor(a,b){if(!b)return null;return b[a]||null}function indexPointerFor(a,b){var c=b.indexOf(a);return c===-1?null:c}function index(a){if(!('encoding-indexes'in global)){throw Error("Indexes missing."+" Did you forget to include encoding-indexes.js first?");}return global['encoding-indexes'][a]}function indexGB18030RangesCodePointFor(a){if((a>39419&&a<189000)||(a>1237575))return null;if(a===7457)return 0xE7C7;var b=0;var c=0;var d=index('gb18030-ranges');var i;for(i=0;i<d.length;++i){var e=d[i];if(e[0]<=a){b=e[0];c=e[1]}else{break}}return c+a-b}function indexGB18030RangesPointerFor(a){if(a===0xE7C7)return 7457;var b=0;var c=0;var d=index('gb18030-ranges');var i;for(i=0;i<d.length;++i){var e=d[i];if(e[1]<=a){b=e[1];c=e[0]}else{break}}return c+a-b}function indexShiftJISPointerFor(c){shift_jis_index=shift_jis_index||index('jis0208').map(function(a,b){return inRange(b,8272,8835)?null:a});var d=shift_jis_index;return d.indexOf(c)}var shift_jis_index;function indexBig5PointerFor(c){big5_index_no_hkscs=big5_index_no_hkscs||index('big5').map(function(a,b){return(b<(0xA1-0x81)*157)?null:a});var d=big5_index_no_hkscs;if(c===0x2550||c===0x255E||c===0x2561||c===0x256A||c===0x5341||c===0x5345){return d.lastIndexOf(c)}return indexPointerFor(c,d)}var big5_index_no_hkscs;var DEFAULT_ENCODING='utf-8';function TextDecoder(a,b){if(!(this instanceof TextDecoder))throw TypeError('Called as a function. Did you forget \'new\'?');a=a!==undefined?String(a):DEFAULT_ENCODING;b=ToDictionary(b);this._encoding=null;this._decoder=null;this._ignoreBOM=false;this._BOMseen=false;this._error_mode='replacement';this._do_not_flush=false;var c=getEncoding(a);if(c===null||c.name==='replacement')throw RangeError('Unknown encoding: '+a);if(!decoders[c.name]){throw Error('Decoder not present.'+' Did you forget to include encoding-indexes.js first?');}var d=this;d._encoding=c;if(Boolean(b['fatal']))d._error_mode='fatal';if(Boolean(b['ignoreBOM']))d._ignoreBOM=true;if(!Object.defineProperty){this.encoding=d._encoding.name.toLowerCase();this.fatal=d._error_mode==='fatal';this.ignoreBOM=d._ignoreBOM}return d}if(Object.defineProperty){Object.defineProperty(TextDecoder.prototype,'encoding',{get:function(){return this._encoding.name.toLowerCase()}});Object.defineProperty(TextDecoder.prototype,'fatal',{get:function(){return this._error_mode==='fatal'}});Object.defineProperty(TextDecoder.prototype,'ignoreBOM',{get:function(){return this._ignoreBOM}})}TextDecoder.prototype.decode=function decode(b,c){var d;if(typeof b==='object'&&b instanceof ArrayBuffer){d=new Uint8Array(b)}else if(typeof b==='object'&&'buffer'in b&&b.buffer instanceof ArrayBuffer){d=new Uint8Array(b.buffer,b.byteOffset,b.byteLength)}else{d=new Uint8Array(0)}c=ToDictionary(c);if(!this._do_not_flush){this._decoder=decoders[this._encoding.name]({fatal:this._error_mode==='fatal'});this._BOMseen=false}this._do_not_flush=Boolean(c['stream']);var e=new Stream(d);var f=[];var g;while(true){var h=e.read();if(h===end_of_stream)break;g=this._decoder.handler(e,h);if(g===finished)break;if(g!==null){if(Array.isArray(g))f.push.apply(f,(g));else f.push(g)}}if(!this._do_not_flush){do{g=this._decoder.handler(e,e.read());if(g===finished)break;if(g===null)continue;if(Array.isArray(g))f.push.apply(f,(g));else f.push(g)}while(!e.endOfStream());this._decoder=null}function serializeStream(a){if(includes(['UTF-8','UTF-16LE','UTF-16BE'],this._encoding.name)&&!this._ignoreBOM&&!this._BOMseen){if(a.length>0&&a[0]===0xFEFF){this._BOMseen=true;a.shift()}else if(a.length>0){this._BOMseen=true}else{}}return codePointsToString(a)}return serializeStream.call(this,f)};function TextEncoder(a,b){if(!(this instanceof TextEncoder))throw TypeError('Called as a function. Did you forget \'new\'?');b=ToDictionary(b);this._encoding=null;this._encoder=null;this._do_not_flush=false;this._fatal=Boolean(b['fatal'])?'fatal':'replacement';var c=this;if(Boolean(b['NONSTANDARD_allowLegacyEncoding'])){a=a!==undefined?String(a):DEFAULT_ENCODING;var d=getEncoding(a);if(d===null||d.name==='replacement')throw RangeError('Unknown encoding: '+a);if(!encoders[d.name]){throw Error('Encoder not present.'+' Did you forget to include encoding-indexes.js first?');}c._encoding=d}else{c._encoding=getEncoding('utf-8');if(a!==undefined&&'console'in global){console.warn('TextEncoder constructor called with encoding label, '+'which is ignored.')}}if(!Object.defineProperty)this.encoding=c._encoding.name.toLowerCase();return c}if(Object.defineProperty){Object.defineProperty(TextEncoder.prototype,'encoding',{get:function(){return this._encoding.name.toLowerCase()}})}TextEncoder.prototype.encode=function encode(a,b){a=a===undefined?'':String(a);b=ToDictionary(b);if(!this._do_not_flush)this._encoder=encoders[this._encoding.name]({fatal:this._fatal==='fatal'});this._do_not_flush=Boolean(b['stream']);var c=new Stream(stringToCodePoints(a));var d=[];var e;while(true){var f=c.read();if(f===end_of_stream)break;e=this._encoder.handler(c,f);if(e===finished)break;if(Array.isArray(e))d.push.apply(d,(e));else d.push(e)}if(!this._do_not_flush){while(true){e=this._encoder.handler(c,c.read());if(e===finished)break;if(Array.isArray(e))d.push.apply(d,(e));else d.push(e)}this._encoder=null}return new Uint8Array(d)};function UTF8Decoder(d){var e=d.fatal;var f=0,utf8_bytes_seen=0,utf8_bytes_needed=0,utf8_lower_boundary=0x80,utf8_upper_boundary=0xBF;this.handler=function(a,b){if(b===end_of_stream&&utf8_bytes_needed!==0){utf8_bytes_needed=0;return decoderError(e)}if(b===end_of_stream)return finished;if(utf8_bytes_needed===0){if(inRange(b,0x00,0x7F)){return b}else if(inRange(b,0xC2,0xDF)){utf8_bytes_needed=1;f=b&0x1F}else if(inRange(b,0xE0,0xEF)){if(b===0xE0)utf8_lower_boundary=0xA0;if(b===0xED)utf8_upper_boundary=0x9F;utf8_bytes_needed=2;f=b&0xF}else if(inRange(b,0xF0,0xF4)){if(b===0xF0)utf8_lower_boundary=0x90;if(b===0xF4)utf8_upper_boundary=0x8F;utf8_bytes_needed=3;f=b&0x7}else{return decoderError(e)}return null}if(!inRange(b,utf8_lower_boundary,utf8_upper_boundary)){f=utf8_bytes_needed=utf8_bytes_seen=0;utf8_lower_boundary=0x80;utf8_upper_boundary=0xBF;a.prepend(b);return decoderError(e)}utf8_lower_boundary=0x80;utf8_upper_boundary=0xBF;f=(f<<6)|(b&0x3F);utf8_bytes_seen+=1;if(utf8_bytes_seen!==utf8_bytes_needed)return null;var c=f;f=utf8_bytes_needed=utf8_bytes_seen=0;return c}}function UTF8Encoder(f){var g=f.fatal;this.handler=function(a,b){if(b===end_of_stream)return finished;if(isASCIICodePoint(b))return b;var c,offset;if(inRange(b,0x0080,0x07FF)){c=1;offset=0xC0}else if(inRange(b,0x0800,0xFFFF)){c=2;offset=0xE0}else if(inRange(b,0x10000,0x10FFFF)){c=3;offset=0xF0}var d=[(b>>(6*c))+offset];while(c>0){var e=b>>(6*(c-1));d.push(0x80|(e&0x3F));c-=1}return d}}encoders['UTF-8']=function(a){return new UTF8Encoder(a)};decoders['UTF-8']=function(a){return new UTF8Decoder(a)};
const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}
/**
* ????????????????????????
* @param {string} msg
* @param {number} size
* @returns {any}
*/
export function stringToQRCode(msg, size) {
    const ptr0 = passStringToWasm0(msg, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.stringToQRCode(ptr0, len0, size);
    return takeObject(ret);
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
* ???????????????????????????
* @param {Uint8Array} data
* @param {number} size
* @returns {any}
*/
export function bytesToQRCode(data, size) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export_0);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.bytesToQRCode(ptr0, len0, size);
    return takeObject(ret);
}

/**
* ????????????????????????
* @param {string} msg
* @param {number} size
* @returns {any}
*/
export function stringToQRCodePng(msg, size) {
    const ptr0 = passStringToWasm0(msg, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.stringToQRCodePng(ptr0, len0, size);
    return takeObject(ret);
}

/**
* ??????????????????PNG??????base64
* @param {Uint8Array} data
* @param {number} size
* @returns {any}
*/
export function bytesToQRCodePng(data, size) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export_0);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.bytesToQRCodePng(ptr0, len0, size);
    return takeObject(ret);
}

/**
*/
export function run() {
    wasm.run();
}
async function load(module, imports) {
    const instance = await WXWebAssembly.instantiate(module, imports);
    return instance;
}

async function init(input) {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_error_64679c06d54a22bd = function(arg0, arg1) {
        console.error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_log_795726173e9e8ef0 = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    wasm.__wbindgen_start();
    return wasm;
}

/**
* ???????????????
* @param {Uint8Array | String} data
* @param {number} size
* @returns {String}
*/
export async function generateQRCode(data, size){
    if(!wasm){
        await init('/utils/qrcode_svg.wasm');
    }
    if(typeof data == "string"){
        return stringToQRCode(data, size);
    }else{
        return bytesToQRCode(data, size);
    }
}

/**
* ??????????????? PNG Base64
* @param {Uint8Array | String} data
* @param {number} size
* @returns {String}
*/
export async function generateQRCodePng(data, size){
    if(!wasm){
        await init('/utils/qrcode_svg.wasm');
    }
    if(typeof data == "string"){
        return stringToQRCodePng(data, size);
    }else{
        return bytesToQRCodePng(data, size);
    }
}

export default{
    generateQRCode,
    generateQRCodePng,
}