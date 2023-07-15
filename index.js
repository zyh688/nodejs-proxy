/**
 * Creates a WebSocket server that proxies TCP connections to a remote server.
 * @param {number} port - The port number to listen on for WebSocket connections.
 * @param {string} uuid - The UUID to match against the first 16 bytes of the first message received from the client.
 * @returns {void}
 */
module.exports = function (port, uuid) {
  // Import required modules
  const net = require("net");
  const { WebSocket, createWebSocketStream } = require("ws");
  // Prepare UUID and Port
  const UUID = (process.env.UUID || uuid || 'd342d11e-d424-4583-b36e-524ab1f0afa4').replaceAll('-', '');
  const PORT = process.env.PORT || port || 7860;
  // 创建一个 WebSocket 服务器
  const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
  // 通过参数启动你的应用
  server.on("connection", (ws) => {
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

      console.log(`A new connection: ${remoteAddress}:${remotePort}`);
      ws.send(new Uint8Array([prefix, 0]));

      let wsStream = createWebSocketStream(ws);
      net.connect({ host: remoteAddress, port: remotePort }, function () {
        this.write(msg.slice(l));
        wsStream.on("error", () => console.error("WebSocket Stream Error")).pipe(this).pipe(wsStream);
      }).on('error', () => console.error('TCP Connection error:', { host: remoteAddress, port: remotePort }));
    }).on("error", () => console.error("WebSocket Connection Error"));
  });
};
// this code used GPT-4 to generate