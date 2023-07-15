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
