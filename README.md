# @3kmfi6hp/nodejs-proxy

`@3kmfi6hp/nodejs-proxy` 是一个 Node.js 包，用于简单实现 vless。支持在各种 Node.js 环境下运行，包括但不限于：Windows、Linux、MacOS、Android、iOS、树莓派等。用于各种 paas 平台，如：replit、heroku 等。

![GitHub license](https://img.shields.io/github/license/3Kmfi6HP/nodejs-proxy)
[![npm](https://img.shields.io/npm/v/@3kmfi6hp/nodejs-proxy)](https://www.npmjs.com/package/@3kmfi6hp/nodejs-proxy)

## 项目优点

- 不容易被 PaaS 平台封锁检测
- 简单易用，支持自定义端口和 UUID
- 可以使用 Dockerfile 部署
- 可以在 fly.io replit codesandbox 上部署。 [如何部署](https://github.com/3Kmfi6HP/nodejs-proxy#相关项目)

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

## 相关项目

- [nodejs-proxy-fly.io](https://github.com/3Kmfi6HP/nodejs-proxy-fly.io) - @3kmfi6hp/nodejs-proxy for fly.io platform.
- [nodejs-proxy-replit](https://github.com/3Kmfi6HP/nodejs-proxy-replit) - @3kmfi6hp/nodejs-proxy for replit platform.
- [nodejs-proxy-codesandbox](https://github.com/3Kmfi6HP/nodejs-proxy-codesandbox) - @3kmfi6hp/nodejs-proxy for codesandbox platform.

这些项目旨在为不同平台提供简单易用的 Node.js 代理。它们允许用户轻松地在其首选平台上部署和使用代理服务器，并提供了一种安全、私密地访问互联网的便捷方式。每个项目都针对特定的平台进行了定制，并提供了与平台特性和功能的无缝集成。

## 免责声明

本项目仅供学习和研究使用，严禁用于任何违反当地法律法规的行为。使用本项目所造成的任何后果，由使用者自行承担，本项目作者不承担任何法律责任。

使用本项目即表示您已经阅读并同意上述免责声明。

_This readme was written by GitHub Copilot._

<!-- This readme was written by GitHub Copilot. -->

<!-- @3kmfi6hp/nodejs-proxy -->
