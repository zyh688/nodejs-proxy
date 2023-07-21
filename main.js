/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

      module.exports = require("tslib");

      /***/
}),
  /* 2 */
  /***/ ((module) => {

      module.exports = require("http");

      /***/
}),
  /* 3 */
  /***/ ((module) => {

      module.exports = require("ws");

      /***/
}),
  /* 4 */
  /***/ ((module) => {

      module.exports = require("uuid");

      /***/
}),
  /* 5 */
  /***/ ((module) => {

      module.exports = require("node:dns");

      /***/
}),
  /* 6 */
  /***/ ((module) => {

      module.exports = require("node:dgram");

      /***/
}),
  /* 7 */
  /***/ ((__unused_webpack_module, exports, __webpack_require__) => {


      Object.defineProperty(exports, "__esModule", ({ value: true }));
      exports.vlessJs = exports.processVlessHeader = exports.closeWebSocket = exports.makeReadableWebSocketStream = exports.delay = void 0;
      var vless_js_1 = __webpack_require__(8);
      Object.defineProperty(exports, "delay", ({ enumerable: true, get: function () { return vless_js_1.delay; } }));
      Object.defineProperty(exports, "makeReadableWebSocketStream", ({ enumerable: true, get: function () { return vless_js_1.makeReadableWebSocketStream; } }));
      Object.defineProperty(exports, "closeWebSocket", ({ enumerable: true, get: function () { return vless_js_1.safeCloseWebSocket; } }));
      Object.defineProperty(exports, "processVlessHeader", ({ enumerable: true, get: function () { return vless_js_1.processVlessHeader; } }));
      Object.defineProperty(exports, "vlessJs", ({ enumerable: true, get: function () { return vless_js_1.vlessJs; } }));


      /***/
}),
  /* 8 */
  /***/ ((__unused_webpack_module, exports, __webpack_require__) => {


      Object.defineProperty(exports, "__esModule", ({ value: true }));
      exports.processVlessHeader = exports.safeCloseWebSocket = exports.makeReadableWebSocketStream = exports.delay = exports.vlessJs = void 0;
      const tslib_1 = __webpack_require__(1);
      const uuid_1 = __webpack_require__(4);
      function vlessJs() {
        return 'vless-js';
      }
      exports.vlessJs = vlessJs;
      const WS_READY_STATE_OPEN = 1;
      function delay(ms) {
        return new Promise((resolve, rej) => {
          setTimeout(resolve, ms);
        });
      }
      exports.delay = delay;
      /**
       * we need make sure read websocket message in order
       * @param ws
       * @param earlyDataHeader
       * @param log
       * @returns
       */
      function makeReadableWebSocketStream(ws, earlyDataHeader, log) {
        let readableStreamCancel = false;
        return new ReadableStream({
          start(controller) {
            ws.addEventListener('message', (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
              // console.log('-----', e.data);
              // is stream is cancel, skip controller.enqueue
              if (readableStreamCancel) {
                return;
              }
              const vlessBuffer = e.data;
              // console.log('MESSAGE', vlessBuffer);
              // console.log(`message is ${vlessBuffer.byteLength}`);
              // this is not backpressure, but backpressure is depends on underying websocket can pasue
              // https://streams.spec.whatwg.org/#example-rs-push-backpressure
              controller.enqueue(vlessBuffer);
            }));
            // The event means that the client closed the client -> server stream.
            // However, the server -> client stream is still open until you call close() on the server side.
            // The WebSocket protocol says that a separate close message must be sent in each direction to fully close the socket.
            ws.addEventListener('error', (e) => {
              log('socket has error');
              readableStreamCancel = true;
              controller.error(e);
            });
            ws.addEventListener('close', () => {
              try {
                log('webSocket is close');
                // is stream is cancel, skip controller.close
                if (readableStreamCancel) {
                  return;
                }
                controller.close();
              }
              catch (error) {
                log(`websocketStream can't close DUE to `, error);
              }
            });
            // header ws 0rtt
            const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
            if (error) {
              log(`earlyDataHeader has invaild base64`);
              safeCloseWebSocket(ws);
              return;
            }
            if (earlyData) {
              controller.enqueue(earlyData);
            }
          },
          pull(controller) {
            // if ws can stop read if stream is full, we can implement backpressure
            // https://streams.spec.whatwg.org/#example-rs-push-backpressure
          },
          cancel(reason) {
            // TODO: log can be remove, if writestream has error, write stream will has log
            log(`websocketStream is cancel DUE to `, reason);
            if (readableStreamCancel) {
              return;
            }
            readableStreamCancel = true;
            safeCloseWebSocket(ws);
          },
        });
      }
      exports.makeReadableWebSocketStream = makeReadableWebSocketStream;
      function base64ToArrayBuffer(base64Str) {
        if (!base64Str) {
          return { error: null };
        }
        try {
          // go use modified Base64 for URL rfc4648 which js atob not support
          base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
          const decode = atob(base64Str);
          const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
          return { earlyData: arryBuffer.buffer, error: null };
        }
        catch (error) {
          return { error };
        }
      }
      function safeCloseWebSocket(socket) {
        try {
          if (socket.readyState === WS_READY_STATE_OPEN) {
            socket.close();
          }
        }
        catch (error) {
          console.error('safeCloseWebSocket error', error);
        }
      }
      exports.safeCloseWebSocket = safeCloseWebSocket;
      //https://github.com/v2ray/v2ray-core/issues/2636
      // 1 字节	  16 字节       1 字节	       M 字节	              1 字节            2 字节      1 字节	      S 字节	      X 字节
      // 协议版本	  等价 UUID	  附加信息长度 M	(附加信息 ProtoBuf)  指令(udp/tcp)	    端口	      地址类型      地址	        请求数据
      // 00                   00                                  01                 01bb(443)   02(ip/host)
      // 1 字节	              1 字节	      N 字节	         Y 字节
      // 协议版本，与请求的一致	附加信息长度 N	附加信息 ProtoBuf	响应数据
      function processVlessHeader(vlessBuffer, userID
        // uuidLib: any,
        // lodash: any
      ) {
        if (vlessBuffer.byteLength < 24) {
          // console.log('invalid data');
          // controller.error('invalid data');
          return {
            hasError: true,
            message: 'invalid data',
          };
        }
        const version = new Uint8Array(vlessBuffer.slice(0, 1));
        let isValidUser = false;
        let isUDP = false;
        if ((0, uuid_1.stringify)(new Uint8Array(vlessBuffer.slice(1, 17))) === userID) {
          isValidUser = true;
        }
        if (!isValidUser) {
          // console.log('in valid user');
          // controller.error('in valid user');
          return {
            hasError: true,
            message: 'invalid user',
          };
        }
        const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];
        //skip opt for now
        const command = new Uint8Array(vlessBuffer.slice(18 + optLength, 18 + optLength + 1))[0];
        // 0x01 TCP
        // 0x02 UDP
        // 0x03 MUX
        if (command === 1) {
        }
        else if (command === 2) {
          isUDP = true;
        }
        else {
          return {
            hasError: true,
            message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
          };
        }
        const portIndex = 18 + optLength + 1;
        const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
        // port is big-Endian in raw data etc 80 == 0x005d
        const portRemote = new DataView(portBuffer).getInt16(0);
        let addressIndex = portIndex + 2;
        const addressBuffer = new Uint8Array(vlessBuffer.slice(addressIndex, addressIndex + 1));
        // 1--> ipv4  addressLength =4
        // 2--> domain name addressLength=addressBuffer[1]
        // 3--> ipv6  addressLength =16
        const addressType = addressBuffer[0];
        let addressLength = 0;
        let addressValueIndex = addressIndex + 1;
        let addressValue = '';
        switch (addressType) {
          case 1:
            addressLength = 4;
            addressValue = new Uint8Array(vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join('.');
            break;
          case 2:
            addressLength = new Uint8Array(vlessBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
            addressValueIndex += 1;
            addressValue = new TextDecoder().decode(vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
            break;
          case 3:
            addressLength = 16;
            const dataView = new DataView(vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
            // 2001:0db8:85a3:0000:0000:8a2e:0370:7334
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
              ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            addressValue = ipv6.join(':');
            // console.log('---------', addressValue)
            // seems no need add [] for ipv6
            // if (addressValue) {
            //   addressValue = `[${addressValue}]`;
            // }
            break;
          default:
            console.log(`invild  addressType is ${addressType}`);
        }
        if (!addressValue) {
          // console.log(`[${address}:${port}] addressValue is empty`);
          // controller.error(`[${address}:${portWithRandomLog}] addressValue is empty`);
          return {
            hasError: true,
            message: `addressValue is empty, addressType is ${addressType}`,
          };
        }
        return {
          hasError: false,
          addressRemote: addressValue,
          portRemote,
          rawDataIndex: addressValueIndex + addressLength,
          vlessVersion: version,
          isUDP,
        };
      }
      exports.processVlessHeader = processVlessHeader;


      /***/
}),
  /* 9 */
  /***/ ((module) => {

      module.exports = require("node:net");

      /***/
}),
  /* 10 */
  /***/ ((module) => {

      module.exports = require("stream");

      /***/
}),
  /* 11 */
  /***/ ((module) => {

      module.exports = require("node:stream/web");

      /***/
})
  /******/]);
  /************************************************************************/
  /******/ 	// The module cache
  /******/ 	var __webpack_module_cache__ = {};
  /******/
  /******/ 	// The require function
  /******/ 	function __webpack_require__(moduleId) {
  /******/ 		// Check if module is in cache
  /******/ 		var cachedModule = __webpack_module_cache__[moduleId];
  /******/ 		if (cachedModule !== undefined) {
  /******/ 			return cachedModule.exports;
      /******/
}
  /******/ 		// Create a new module (and put it into the cache)
  /******/ 		var module = __webpack_module_cache__[moduleId] = {
  /******/ 			// no module.id needed
  /******/ 			// no module.loaded needed
  /******/ 			exports: {}
      /******/
};
  /******/
  /******/ 		// Execute the module function
  /******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  /******/
  /******/ 		// Return the exports of the module
  /******/ 		return module.exports;
    /******/
}
  /******/
  /************************************************************************/
  var __webpack_exports__ = {};
  // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
  (() => {
    var exports = __webpack_exports__;

    Object.defineProperty(exports, "__esModule", ({ value: true }));
    const tslib_1 = __webpack_require__(1);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const http_1 = __webpack_require__(2);
    // import { parse } from 'url';
    const ws_1 = __webpack_require__(3);
    // import { index401, serverStaticFile } from './app/utils';
    const uuid_1 = __webpack_require__(4);
    // import { createReadStream } from 'node:fs';
    const node_dns_1 = __webpack_require__(5);
    const node_dgram_1 = __webpack_require__(6);
    const vless_js_1 = __webpack_require__(7);
    const node_net_1 = __webpack_require__(9);
    const stream_1 = __webpack_require__(10);
    const web_1 = __webpack_require__(11);
    // import { upgrade } from 'undici';
    function createVLESSServer(port, userID) {
      port = process.env.PORT || port || '3001';
      const smallRAM = process.env.SMALLRAM || false;
      userID = process.env.UUID || userID || 'd342d11e-d424-4583-b36e-524ab1f0afa4';
      //'ipv4first' or 'verbatim'
      const dnOder = process.env.DNSORDER || 'verbatim';
      if (dnOder === 'ipv4first') {
        (0, node_dns_1.setDefaultResultOrder)(dnOder);
      }
      const isVaildUser = (0, uuid_1.validate)(userID);
      if (!isVaildUser) {
        console.log('not set valid UUID');
      }
      const server = (0, http_1.createServer)((req, resp) => {
        const url = new URL(req.url, `http://${req.headers['host']}`);
        if (!isVaildUser) {
          resp.writeHead(401);
          resp.write('not set valid UUID');
          resp.end();
          return;
        }
        if (req.method === 'GET') {
          handleGetRequest(url, req, resp);
          return;
        }
        if (!isUserAgentMozilla(req)) {
          resp.writeHead(401);
          resp.write('user-agent not mozilla');
          resp.end();
          return;
        }
        if (isUuidPresentInPath(url, userID)) {
          resp.writeHead(200);
          resp.write(userID);
          resp.end();
          return;
        }
      });
      function handleGetRequest(url, req, resp) {
        if (url.pathname.startsWith('/health')) {
          sendResponse(resp, 200, 'health 200');
        }
        else if (url.pathname.startsWith('/')) {
          sendResponse(resp, 200, 'hello world');
        }
      }
      function isUserAgentMozilla(req) {
        return req.headers['user-agent'].includes('Mozilla/5.0') && req.headers.upgrade !== 'websocket';
      }
      function isUuidPresentInPath(url, userID) {
        return url.pathname.includes(userID);
      }
      function sendResponse(resp, statusCode, message) {
        resp.writeHead(statusCode);
        resp.write(message);
        resp.end();
      }
      const wsserver = new ws_1.WebSocketServer({ noServer: true });
      wsserver.on('connection', function connection(ws, request) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
          let address = '';
          let portWithRandomLog = '';
          // Get the IP address of the client
          const clientIP = request.socket.remoteAddress;
          try {
            const log = (info, event) => {
              console.log(`Address ${address}:${portWithRandomLog} ${info} from address: ${clientIP}`, event || '');
            };
            let remoteConnection = null;
            let udpClientStream = null;
            // eslint-disable-next-line @typescript-eslint/ban-types
            let remoteConnectionReadyResolve;
            const earlyDataHeader = request.headers['sec-websocket-protocol'];
            const readableWebSocketStream = (0, vless_js_1.makeReadableWebSocketStream)(ws, earlyDataHeader, log);
            let vlessResponseHeader = null;
            // ws  --> remote
            readableWebSocketStream
              .pipeTo(new web_1.WritableStream({
                write(chunk, controller) {
                  return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (!Buffer.isBuffer(chunk)) {
                      chunk = Buffer.from(chunk);
                    }
                    if (udpClientStream) {
                      const writer = udpClientStream.writable.getWriter();
                      // nodejs buffer to ArrayBuffer issue
                      // https://nodejs.org/dist/latest-v18.x/docs/api/buffer.html#bufbuffer
                      yield writer.write(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.length));
                      writer.releaseLock();
                      return;
                    }
                    if (remoteConnection) {
                      yield socketAsyncWrite(remoteConnection, chunk);
                      // remoteConnection.write(chunk);
                      return;
                    }
                    const vlessBuffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.length);
                    const { hasError, message, portRemote, addressRemote, rawDataIndex, vlessVersion, isUDP, } = (0, vless_js_1.processVlessHeader)(vlessBuffer, userID);
                    address = addressRemote || '';
                    portWithRandomLog = `${portRemote} ${isUDP ? 'udp' : 'tcp'} `;
                    if (hasError) {
                      controller.error(`Address ${address}:${portWithRandomLog} ${message} `);
                      return;
                    }
                    // const addressType = requestAddr >> 42
                    // const addressLength = requestAddr & 0x0f;
                    console.log(`Address ${address}:${portWithRandomLog} connecting`);
                    vlessResponseHeader = new Uint8Array([vlessVersion[0], 0]);
                    const rawClientData = vlessBuffer.slice(rawDataIndex);
                    if (isUDP) {
                      // 如果仅仅是针对DNS， 这样是没有必要的。因为xray 客户端 DNS A/AAA query 都有长度 header，
                      // 所以直接和 DNS server over TCP。所以无需 runtime 支持 UDP API。
                      // DNS over UDP 和 TCP 唯一的区别就是 Header section format 多了长度
                      //  https://www.rfc-editor.org/rfc/rfc1035#section-4.2.2
                      udpClientStream = makeUDPSocketStream(portRemote, address);
                      const writer = udpClientStream.writable.getWriter();
                      writer.write(rawClientData).catch((error) => console.log);
                      writer.releaseLock();
                      remoteConnectionReadyResolve(udpClientStream);
                    }
                    else {
                      remoteConnection = yield connect2Remote(portRemote, address, log);
                      remoteConnection.write(new Uint8Array(rawClientData));
                      remoteConnectionReadyResolve(remoteConnection);
                    }
                  });
                },
                close() {
                  // if (udpClientStream ) {
                  //   udpClientStream.writable.close();
                  // }
                  // (remoteConnection as Socket).end();
                  console.log(`Address ${address}:${portWithRandomLog} readableWebSocketStream is close`);
                },
                abort(reason) {
                  // TODO: log can be remove, abort will catch by catch block
                  console.log(`Address ${address}:${portWithRandomLog} readableWebSocketStream is abort`, JSON.stringify(reason));
                },
              }))
              .catch((error) => {
                console.error(`Address ${address}:${portWithRandomLog} readableWebSocketStream pipeto has exception`, error.stack || error);
                // error is cancel readable stream anyway, no need close websocket in here
                // closeWebSocket(webSocket);
                // close remote conn
                // remoteConnection?.close();
              });
            yield new Promise((resolve) => (remoteConnectionReadyResolve = resolve));
            // remote --> ws
            let responseStream = udpClientStream === null || udpClientStream === void 0 ? void 0 : udpClientStream.readable;
            if (remoteConnection) {
              // ignore type error
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              responseStream = stream_1.Readable.toWeb(remoteConnection, {
                strategy: {
                  // due to nodejs issue https://github.com/nodejs/node/issues/46347
                  highWaterMark: smallRAM ? 100 : 1000, // 1000 * tcp mtu(64kb) = 64mb
                },
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const count = 0;
            // if readable not pipe can't wait fro writeable write method
            yield responseStream.pipeTo(new web_1.WritableStream({
              start() {
                if (ws.readyState === ws.OPEN) {
                  ws.send(vlessResponseHeader);
                }
              },
              write(chunk, controller) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                  // count += chunk.byteLength;
                  // console.log('ws write', count / (1024 * 1024));
                  // console.log(
                  //   '-----++++',
                  //   (remoteConnection as Socket).bytesRead / (1024 * 1024),
                  //   (remoteConnection as Socket).readableHighWaterMark
                  // );
                  // we have issue there, maybe beacsue nodejs web stream has bug.
                  // socket web stream will read more data from socket
                  if (ws.readyState === ws.OPEN) {
                    yield wsAsyncWrite(ws, chunk);
                  }
                  else {
                    if (!remoteConnection.destroyed) {
                      remoteConnection.destroy();
                    }
                  }
                });
              },
              close() {
                console.log(`Address ${address}:${portWithRandomLog} remoteConnection!.readable is close`);
              },
              abort(reason) {
                (0, vless_js_1.closeWebSocket)(ws);
                console.error(`Address ${address}:${portWithRandomLog} remoteConnection!.readable abort`, reason);
              },
            }));
          }
          catch (error) {
            console.error(`Address ${address}:${portWithRandomLog} processWebSocket has exception `, error.stack || error);
            (0, vless_js_1.closeWebSocket)(ws);
          }
        });
      });
      server.on('upgrade', (request, socket, head) => wsserver.handleUpgrade(request, socket, head, (ws) => wsserver.emit('connection', ws, request)));
      // Declare the host as a constant.
      const host = '::';
      server.listen({ port, host }, () => console.log(`Server is listening on port: ${port}\n`));
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    function connect2Remote(port, host, log) {
      return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resole, reject) => {
          const remoteSocket = (0, node_net_1.connect)({
            port: port,
            host: host,
            // https://github.com/nodejs/node/pull/46587
            // autoSelectFamily: true,
          }, () => {
            log(`connected`);
            resole(remoteSocket);
          });
          remoteSocket.addListener('error', () => {
            reject('remoteSocket has error');
          });
        });
      });
    }
    function socketAsyncWrite(ws, chunk) {
      return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
          ws.write(chunk, (error) => {
            if (error) {
              reject(error);
            }
            else {
              resolve('');
            }
          });
        });
      });
    }
    function wsAsyncWrite(ws, chunk) {
      return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
          ws.send(chunk, (error) => {
            if (error) {
              reject(error);
            }
            else {
              resolve('');
            }
          });
        });
      });
    }
    function makeUDPSocketStream(portRemote, address) {
      const udpClient = (0, node_dgram_1.createSocket)('udp4');
      const transformStream = new web_1.TransformStream({
        start(controller) {
          /* … */
          udpClient.on('message', (message, info) => {
            // console.log(
            //   `udp package received ${info.size} bytes from ${info.address}:${info.port}`,
            //   Buffer.from(message).toString('hex')
            // );
            controller.enqueue(Buffer.concat([
              new Uint8Array([(info.size >> 8) & 0xff, info.size & 0xff]),
              message,
            ]));
          });
          udpClient.on('error', (error) => {
            console.log('udpClient error event', error);
            controller.error(error);
          });
        },
        transform(chunk, controller) {
          return tslib_1.__awaiter(this, void 0, void 0, function* () {
            //seems v2ray will use same web socket for dns query..
            //And v2ray will combine A record and AAAA record into one ws message and use 2 btye for dns query length
            for (let index = 0; index < chunk.byteLength;) {
              const lengthBuffer = chunk.slice(index, index + 2);
              const udpPakcetLength = new DataView(lengthBuffer).getInt16(0);
              const udpData = new Uint8Array(chunk.slice(index + 2, index + 2 + udpPakcetLength));
              index = index + 2 + udpPakcetLength;
              yield new Promise((resolve, reject) => {
                udpClient.send(udpData, portRemote, address, (err) => {
                  if (err) {
                    console.log('udps send error', err);
                    controller.error(`Failed to send UDP packet !! ${err}`);
                    safeCloseUDP(udpClient);
                  }
                  // console.log(
                  //   'udp package sent',
                  //   Buffer.from(udpData).toString('hex')
                  // );
                  resolve(true);
                });
              });
              // eslint-disable-next-line no-self-assign
              index = index;
            }
            // console.log('dns chunk', chunk);
            // console.log(portRemote, address);
            // port is big-Endian in raw data etc 80 == 0x005d
          });
        },
        flush(controller) {
          safeCloseUDP(udpClient);
          controller.terminate();
        },
      });
      return transformStream;
    }
    function safeCloseUDP(client) {
      try {
        client.close();
      }
      catch (error) {
        console.log('error close udp', error);
      }
    }
    exports.createVLESSServer = createVLESSServer;

  })();

  var __webpack_export_target__ = exports;
  for (var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
  if (__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
  /******/
})()
  ;
  //# sourceMappingURL=main.js.map