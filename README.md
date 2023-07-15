# @3kmfi6hp/nodejs-proxy

`@3kmfi6hp/nodejs-proxy` 是一个 Node.js 包，用于简单实现 vless。支持在各种 Node.js 环境下运行，包括但不限于：Windows、Linux、MacOS、Android、iOS、树莓派等。用于各种 paas 平台，如：replit、heroku 等。

## 安装

使用 npm 安装：

```bash
npm i -g @3kmfi6hp/nodejs-proxy
```

## 使用

```bash
nodejs-proxy
```

自定义端口 和 uuid：

```bash
nodejs-proxy -p 7860 -u d342d11e-d424-4583-b36e-524ab1f0afa4
```

查看帮助

```bash
nodejs-proxy --help
Options:
      --version  Show version number                                   [boolean]
  -p, --port     Specify the port number                         [default: 7860]
  -u, --uuid     Specify the uuid
                               [default: "d342d11e-d424-4583-b36e-524ab1f0afa4"]
      --help     Show help                                             [boolean]
```

不是全局`-g`的话，需要在项目目录下执行：

```bash
npm i @3kmfi6hp/nodejs-proxy
```

运行：

```bash
npx nodejs-proxy
```

使用 `--help` 查看帮助：

```bash
npx nodejs-proxy --help
Options:
      --version  Show version number                                   [boolean]
  -p, --port     Specify the port number                         [default: 7860]
  -u, --uuid     Specify the uuid
                               [default: "d342d11e-d424-4583-b36e-524ab1f0afa4"]
      --help     Show help                                             [boolean]
```

## Dockerfile 使用

```dockerfile
FROM node:latest
ENV PORT=7860
ENV UUID=d342d11e-d424-4583-b36e-524ab1f0afa4
# EXPOSE 7860
RUN npm i -g @3kmfi6hp/nodejs-proxy
CMD ["nodejs-proxy"]
```

在 fly.io 上部署：

```fly.toml
# fly.toml file generated for nodejs-proxy

# App name (optional) needs to be changed if you have multiple apps
app = "nodejs-proxy"
primary_region = "sin" # Replace with the region closest to you, e.g. ord
kill_signal = "SIGINT"
kill_timeout = "5s"

# Docker image to use
image = "flyio/node"

# HTTP port
[env]
PORT = "7860"

# UUID
[env]
UUID = "d342d11e-d424-4583-b36e-524ab1f0afa4"

# Command to start the app
[cmd]
# Start the proxy
start = "nodejs-proxy"

[[services]]
  protocol = "tcp"
  internal_port = 7860
  processes = ["app"]

  [[services.ports]]
    port = 7860
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "1s"
    restart_limit = 0

```

## 连接方法

例如使用 http：`vless://d342d11e-d424-4583-b36e-524ab1f0afa4@127.0.0.1:8787?encryption=none&security=none&fp=randomized&type=ws&path=%2F#default`
此 `vless` 地址的参数可解析如下：

- `d342d11e-d424-4583-b36e-524ab1f0afa4`：这是一个 UUID（Universally Unique Identifier）,在本场景中，通常作为用户标识使用。
- `127.0.0.1:8787`: 这是一个 IP 地址和端口号，这里指定了 `vless` 连接到的服务器地址（`127.0.0.1` 就是本地的环回地址，也就是说服务器就在本机）和端口号 (8787)。
- `encryption=none`：这意味着不使用任何加密方法。
- `security=none`：这表示不启用任何额外的安全特性。
- `fp=randomized`：这可能是指流量的伪装或混淆方法，`fp` 可能是 fingerprint（指纹）的缩写，`random` 表示采取随机化处理。
- `type=ws`：指定了传输协议类型，这里使用的是 WebSocket 协议 (`ws`)。
- `path=%2F`：URL 的路径，这里的 `%2F` 实际是 URL 编码，对应的字符为 `/`，所以路径为 `/` 。
- `#default`：这是你的 `vless` 配置的别名，用于方便辨识。

例如使用 https：`vless://d342d11e-d424-4583-b36e-524ab1f0afa4@link-to-your-replit-project.repl.co:443?encryption=none&security=tls&fp=random&type=ws&path=%2Fws#link-to-your-replit-project.repl.co`
此 `vless` 地址的参数可解析如下：

- `d342d11e-d424-4583-b36e-524ab1f0afa4`：这是一个 UUID（Universally Unique Identifier）,在本场景中，通常作为用户标识使用。
- `link-to-your-replit-project.repl.co:443`: 这是一个 IP 地址和端口号，这里指定了 `vless` 连接到的服务器地址（`link-to-your-replit-project.repl.co` 就是连接地址域名，也就是说服务器就在那里）和端口号 (443)。
- `encryption=none`：这意味着不使用任何加密方法。
- `security=tls`：这表示启用 tls 安全特性。
- `fp=random`：这可能是指流量的伪装或混淆方法，`fp` 可能是 fingerprint（指纹）的缩写，`random` 表示采取随机化处理。
- `type=ws`：指定了传输协议类型，这里使用的是 WebSocket 协议 (`ws`)。
- `path=%2Fws`：URL 的路径，这里的 `%2F` 实际是 URL 编码，对应的字符为 `/`，所以路径为 `/ws` 。
- `#link-to-your-replit-project.repl.co`：这是你的 `vless` 配置的别名，用于方便辨识。

请参考具体的 `vless` 文档以获取更加详细的信息。部分参数可能依赖于具体的 `vless` 客户端和服务器的实现，可能需要根据实际情况进行调整。

readme.md by GPT-4
