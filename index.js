/**
 * Creates a WebSocket server that proxies TCP connections to a remote server.
 * @param {number} port - The port number to listen on for WebSocket connections.
 * @param {string} uuid - The UUID to match against the first 16 bytes of the first message received from the client.
 * @returns {void}
 */
module.exports = function (port, uuid) {
  // Import required modules
  const stream = require('stream');

  const net = require("net");
  const { WebSocket, createWebSocketStream } = require("ws");
  // Prepare UUID and Port
  const UUID = (process.env.UUID || uuid || 'd342d11e-d424-4583-b36e-524ab1f0afa4').replaceAll('-', '');
  const PORT = process.env.PORT || port || 7860;
  const decodeHeader = (header) => {
    const { earlyData, error } = base64ToArrayBuffer(header);
    if (error) {
      return log(error.message);
    }
    return earlyData;
  };
  // 创建一个 WebSocket 服务器
  const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
  /**
 * A function to log errors.
 * @param {string} message
 * @returns {void}
 */
  const log = (message) => {
    console.log(Date.now() + " - " + message);
  };
  // Start your app with parameters
  server.on("connection", (ws, req) => {
    const earlyDataHeader = req.headers['sec-websocket-protocol'] || '';
    const earlyData = decodeHeader(earlyDataHeader);
    // console.log(`earlyDataHeader: ${earlyDataHeader}`);
    // Get the IP address of the client
    const clientIP = req.socket.remoteAddress;
    ws.once("message", (msg) => {
      let prefix = msg[0],
        uuid = msg.slice(1, 17),
        l = msg.slice(17, 18).readUInt8() + 19,
        remotePort = msg.slice(l, l += 2).readUInt16BE(0),
        remoteAddressType = msg.slice(l, l += 1).readUInt8(),
        remoteAddress;

      if (!uuid.every((val, i) => val == parseInt(UUID.substr(2 * i, 2), 16)))
        return console.error("Invalid UUID");

      if (remoteAddressType == 1) {
        remoteAddress = msg.slice(l, l += 4).join(".");
      } else if (remoteAddressType == 2) {
        remoteAddress = new TextDecoder().decode(msg.slice(l + 1, l += 1 + msg.slice(l, l + 1).readUInt8()));
      } else if (remoteAddressType == 3) {
        remoteAddress = msg.slice(l, l += 16).reduce((str, byte, i, bytes) => i % 2 ? str.concat(bytes.slice(i - 1, i + 1)) : str, []).map(bytes => bytes.readUInt16BE(0).toString(16)).join(":");
      } else {
        remoteAddress = "";
      }

      console.log(`A new connection: ${remoteAddress}:${remotePort} from address: ${clientIP}`);
      ws.send(new Uint8Array([prefix, 0]));
      // start streaming connection
      // const wsReadableStream = createWebSocketStream(ws, { encoding: null, objectMode: false, allowHalfOpen: true });
      // start streaming connection
      const wsReadableStream = makeReadableWebSocketStream(ws, earlyData, log);
      // const nodeStream = stream.Readable.from(wsReadableStream.getReader().read(), { objectMode: true });
      const reader = wsReadableStream.getReader();
      const nodeStream = stream.Readable.from(readerGenerator(reader), { objectMode: true });

      // Create a TCP connection to the remote server

      const tcpSocket = net.connect({ host: remoteAddress, port: remotePort }, function () {
        // After successful connection to the TCP server, write the remaining part of msg to it.
        tcpSocket.write(msg.slice(l)), (function
          () {
          console.log('write done');
        });

        // Pipe the WebSocket data to the TCP connection:
        // wsReadableStream.pipe(tcpSocket);
        nodeStream.pipe(tcpSocket), (function
          () {
          console.log('pipe done');
        });
        // Pipe the TCP connection data back to the WebSocket client

        // Pipe the TCP server data back to the WebSocket client
        tcpSocket.on('data', (data) => {
          console.log('TCP Connection data:', { host: remoteAddress, port: remotePort, data: data });
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

      });

      tcpSocket.on('error', (err) => {
        console.error('TCP Connection error:', { host: remoteAddress, port: remotePort, error: err });
        tcpSocket.end();  // Close the TCP connection
        ws.close();  // Close the WebSocket connection
      });

    }).on("error", () => console.error("WebSocket Connection Error"));
  });
};
// this code used GPT-4 to generate
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener('message', (event) => {
        if (readableStreamCancel) {
          return;
        }
        const message = event.data;
        controller.enqueue(message);
      });

      // The event means that the client closed the client -> server stream.
      // However, the server -> client stream is still open until you call close() on the server side.
      // The WebSocket protocol says that a separate close message must be sent in each direction to fully close the socket.
      webSocketServer.addEventListener('close', () => {
        // client send close, need close server
        // if stream is cancel, skip controller.close
        safeCloseWebSocket(webSocketServer);
        if (readableStreamCancel) {
          return;
        }
        controller.close();
      }
      );
      webSocketServer.addEventListener('error', (err) => {
        log('webSocketServer has error');
        controller.error(err);
      }
      );
      // for ws 0rtt
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) {
        controller.error(error);
      } else if (earlyData) {
        controller.enqueue(earlyData);
      }
    },

    pull(controller) {
      // if ws can stop read if stream is full, we can implement backpressure
      // https://streams.spec.whatwg.org/#example-rs-push-backpressure
    },
    cancel(reason) {
      // 1. pipe WritableStream has error, this cancel will called, so ws handle server close into here
      // 2. if readableStream is cancel, all controller.close/enqueue need skip,
      // 3. but from testing controller.error still work even if readableStream is cancel
      if (readableStreamCancel) {
        return;
      }
      log(`ReadableStream was canceled, due to ${reason}`)
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    }
  });

  return stream;

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
    if (socket.readyState === socket.OPEN) {
      socket.close();
    }
  }
  catch (error) {
    console.error('safeCloseWebSocket error', error);
  }
}
exports.safeCloseWebSocket = safeCloseWebSocket;

// Create asynchronous iterator
async function* readerGenerator(reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('done');
      break
    } else {
      console.log('value', value);
    }
    yield value;
  }
}