# dsh-opencode-go-plus

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 中使用 OpenCode Go 订阅模型，支持流式回复、工具调用、图片输入与额度显示。

插件自动添加 OpenCode Go 所需的会话请求头，并从网关获取可用模型目录，显示套餐剩余额度。通过 DSH 插件命令安装，无需修改 DSH 源码。

网关新上线的模型会**自动适配**：插件按同族已知模型克隆协议与参数，同族不存在时退到全局最接近的模型兜底（详见下文"自动适配新模型"），无需等待目录更新。

> **本包是 [`dsh-opencode-go`](https://github.com/Duskriver/dsh-opencode-go) 的维护分支**，针对两个会把模型**静默地从列表里弄丢**的场景做了修复，详见[与上游的差异](#与上游-dsh-opencode-go-的差异)。


## 安装与使用

### Web

```sh
dsh plugin --profile web add dsh-opencode-go-plus
```

安装后启动或重启 `dsh web`：

1. 打开 **设置 → 模型**，找到 **OpenCode Go** 一行。
2. 该行显示 API Key 状态（绿点 = 已配置）。
3. 在会话的模型选择器中选择 OpenCode Go 模型。

API Key 来自你的 OpenCode Go 订阅（默认引用 `OPENCODE_API_KEY`，可在
`settings.yaml` 的 `llm-opencode-go.apiKeyEnv` 改名）。安装插件不会自动更改默认模型。

> **0.3.0 起，插件不再有独立的"设置 → OpenCode Go"分区。** 配置入口就是
> **设置 → 模型** 里的 OpenCode Go 行，与其它 provider 并列。该行的"编辑"里只有
> 通用凭据字段；`refreshMinutes`、`autoDiscover`、图片预算等插件专有字段仍在
> `settings.yaml` 的 `llm-opencode-go` 段，行内会明确提示这一点。详见
> [更新日志 0.3.0](#030)。

### Headless

安装到 Headless profile：

```sh
dsh plugin --profile headless add dsh-opencode-go-plus
```

将以下内容保存为 `headless.patch.yml`，选择默认模型：

```yaml
- id: agent-default-model
  config:
    provider: opencode-go
    model: deepseek-v4.1-flash
```

在 Bash 或 Zsh 中读取 API Key，然后运行任务：

```sh
read -s OPENCODE_API_KEY
export OPENCODE_API_KEY
dsh --profile headless --patch ./headless.patch.yml "你好"
```

模型 ID 须在当前网关目录中可用。Web 和 Headless 使用各自的 profile，需要分别安装插件。

## 与上游 `dsh-opencode-go` 的差异

本包以 `dsh-opencode-go@0.1.2` 的编译产物为基线，只改动 `lib/` 内的宿主侧逻辑，UI 与协议转换保持不变。五处改动都针对同一类事故：**模型明明在网关目录里，却没出现在选择器中，而且不给任何提示。**

### 1. 与基线共存时不再拖垮整棵插件树 ★

这一条最严重，也最容易被漏掉。上游只处理了**路由**冲突（`registerAdapter`），却漏掉了第二处同样 all-or-nothing 的注册：`ctx.llm.registerModelDiscovery(settingsNs, …)`，它以**设置命名空间**为键，重复注册抛 `DUPLICATE_DISCOVERY`。

而本包为了保证**旧配置继续生效**，刻意沿用了同一个设置命名空间 `llm-opencode-go`。于是基线包与本包装进同一个 profile 时，后加载的那个会在 discovery 这一步抛错——**上游没有捕获它，错误从 loader 自身的 effect 里抛出，直接导致 `dsh web` 完全起不来**：

```
Error: dsh: plugin tree failed to load: failed to apply loader entry
opencode-go-plus (dsh-opencode-go-plus):
model discovery for "llm-opencode-go" is already registered
```

注意受害面：挂掉的不只是 OpenCode Go，**同一 profile 里其余的插件（market / trae / receipt / quota…）全部一起加载失败**。

现在会在**claim 路由之前**先做这一步，撞车时本包**静默退场**（不占用路由、不挂设置页），并打一条 warn 说明原因与修法：

```
llm-opencode-go: model discovery for the settings namespace "llm-opencode-go"
is already registered by another plugin, so OpenCode Go Plus stays disabled in
this profile. The baseline package "dsh-opencode-go" owns both that namespace
and the "opencode-go" route and shares neither, so the two cannot coexist in one
profile; remove the other one ("dsh plugin --profile <profile> remove
dsh-opencode-go") and restart to use this package instead.
```

> ⚠️ **本包不能与 `dsh-opencode-go` 同时安装。** 两者共用设置命名空间与 provider 路由，
> 且**谁先加载谁赢**：升级时请先卸载旧包，见
> [`examples/migrate-from-fork.patch.yml`](./examples/migrate-from-fork.patch.yml)。
>
> 本包的退场是**安静的**：命令行上只会看到 `dsh web` 正常启动，模型数停在旧包的 37。
> 判断依据是**模型数量**——旧包 37 条（无 `union-alpha`），本包 38 条。

### 2. `opencode-go` 路由被占用时不再静默放弃

`ctx.llm.registerAdapter()` 同样是全有或全无的：只要请求的路由已被占用就抛 `DUPLICATE_ADAPTER`。
上游捕获后只写一行 error 日志然后放弃，结果**整个动态目录都不可用**，而占位的往往是
`settings.yaml` 里 `llm-pi-ai.providers.opencode-go` 那种**手工物化的静态模型表** ——
它不会自己增长，于是网关新上线的模型永远不出现。

现在会在 `DUPLICATE_ADAPTER` 时改注册 `opencode-go-plus` 路由，并打一条 warn 说明原因与修法：

```
llm-opencode-go: provider "opencode-go" is already registered by another adapter,
so this plugin serves "opencode-go-plus" instead. The usual cause is a model list
materialized into settings.yaml under "llm-pi-ai.providers.opencode-go"; removing
that entry lets this plugin own "opencode-go" and serve the live catalog there.
```

> 想让插件重新占用 `opencode-go` 这个名字，删掉 `settings.yaml` 里那一段即可。
> 注意：**不要在 dsh 的「设置 → 模型 → opencode-go」里点「获取可用模型 → 添加所选」**，
> 那一步会把目录重新物化回 `settings.yaml`，问题复现。

### 3. 全新家族的模型不再被丢弃

上游要求未知模型必须能找到**同族**（首词归一化后相同）的已知模型才能克隆协议与参数，
找不到就整条丢掉。网关一旦上线一个全新品牌的模型（例如 `union-alpha`），它就永远不出现在列表里。

现在同族缺失时改为**借用全局最接近的模型**：先按 token 重叠度打分，再归到目录内多数协议，
最后用 ID 长度接近度决胜。网关 `/models` 只返回 `id`/`object`/`created`/`owned_by`，
不含任何容量或协议信息，所以这仍然是估计值 —— 但**用户能在选择器里看到它、能选中它、能改它**，
而丢弃只会让人以为网关没有这个模型。猜错的参数可以在设置里用 `modelOverrides` 覆盖。

### 4. 解析结果自检日志

每次目录解析都会打一行四项计数，回答"为什么这个模型不在列表里"：

```
llm-opencode-go: catalog resolved (curated 28, live listing 38, adapted 10, omitted 0, served 38)
```

- `curated` —— 内置 pi-ai 目录 + `catalogAdditions` 追加项
- `live listing` —— 网关 `/models` 返回的条数（失败时该行降级为 warn，并显示退回本地表）
- `adapted` —— 未知 ID 按族克隆/借用后加入的条数
- `omitted` —— 完全无法描述的 ID（现在应为 0；非 0 时会列出具体 ID 并提示用 `catalogAdditions` 补）
- `served` —— 最终出现在选择器里的条数

另有 `missing` 提示：目录里有、但网关已不再列出的 ID（通常是已下线）会被标注为 withheld。

### 5. `catalogAdditions` 改为可配置

上游把追加项硬编码在源码里。现在它是设置项，默认值不变，可在 **设置 → OpenCode Go** 里增删：

```yaml
llm-opencode-go:
  catalogAdditions:
    - id: deepseek-v4.1-flash
      siblingId: deepseek-v4-flash
      inputSiblingId: deepseek-v4-flash-vision-exp
      name: DeepSeek V4.1 Flash
```

条目必须四个字段齐全，缺一个会被忽略（不会半成品地塞进目录）。

### 与上游相同的部分

- 请求头：Harness User-Agent（`attributionHeaders()`）+ `x-opencode-session`，字段与上游一致
- 设置命名空间仍为 `llm-opencode-go`，原有配置项继续生效
- 新增的设置项只有 `catalogAdditions` 一项，其余 schema 未动
- `dsh.bundle` / `dsh.client` 清单未动，客户端 UI 与 `lib/client.js` 未改

## 自动适配新模型

网关 `/models` 目录只返回模型 ID，不披露协议与参数，而网关轮换模型的速度快于任何目录的发版。本插件的模型列表 = 内置适配表 ∩ 网关实时目录，再加上**自动适配的未知模型**：

- **家族匹配**：未知 ID 按首词归族（版本号归一化，`qwen4-max` 与 `qwen3.6-plus` 同属 `qwen` 族），克隆同族中匹配度最高的模型的协议、兼容参数、思考档位与容量。
- **多数协议**：同族协议不一致时（如 qwen 族同时存在 completions 与 messages 条目），按族内多数协议选择克隆来源。
- **视觉输入**：ID 带 `vision`/`vl`/`omni`/`multimodal` 的模型继承族内支持图片的同族模型的输入模态。
- **全新家族**（网关和内置目录都没有同族模型）：退回全局候选，按 token 重叠度 + 多数协议 + ID 长度接近度借用参数。**不会**再被丢弃；参数是估计值，可用 `modelOverrides` 覆盖。
- 推断只影响该模型自身的请求，即使猜错也不影响其他模型；容量（上下文窗口等）为估计值。
- 设置页 **设置 → OpenCode Go → 自动适配新模型** 开关可随时关闭，恢复"仅展示已适配模型"的行为。
- 默认每 **5 分钟**重新解析一次实时目录（可在高级设置中调整），新模型自动出现在选择器中。

## 订阅用量显示

订阅额度由插件的 usage 面板显示，路径为 `GET {baseURL}/usage`。

## 配置

Web 用户可直接在 **设置 → OpenCode Go** 中修改配置。启用开关立即生效。

## 常见问题

### 从 `dsh-opencode-go` 升级过来，插件好像没生效

**这是最常见的迁移问题，而且完全没有报错。** 本包与基线包共用设置命名空间 `llm-opencode-go` 和 provider 路由 `opencode-go`，两者**不能同时安装**：谁先加载谁赢，后加载的那个会安静退场，`dsh web` 照常启动。

装完后请核对**模型数量**：

| 现象 | 说明 |
|---|---|
| 38 条，且含 `union-alpha` | 本包在服务，升级成功 |
| 37 条，且无 `union-alpha` | **旧包还在服务**，本包已退场 |

确认修法：

```sh
dsh plugin --profile web remove dsh-opencode-go
dsh plugin --profile web add ./dsh-opencode-go-plus-0.3.0.tgz
```

<details>
<summary>为什么不报错？</summary>

`ctx.llm.registerModelDiscovery()` 以设置命名空间为键，重复注册会抛 `DUPLICATE_DISCOVERY`，而它从 loader 自身的 effect 里抛出 —— 若不捕获，**整棵插件树加载失败，`dsh web` 直接起不来，且 market / trae / receipt / quota 全部一起挂掉**。本包因此选择捕获它并安静退场。

同时 `ctx.logger.warn` 只写入 harness 的内存日志环形缓冲，**不输出到终端**，所以命令行上看不到任何提示。退场原因只在日志通道里可见。

</details>

### 提示 `opencode-go` 路由已被占用

同一 profile 中只能有一个适配器提供 `opencode-go` 路由。如果已经通过其他插件或通用 pi-ai 配置接入 OpenCode Go，本插件会**自动改用 `opencode-go-plus` 路由**并在日志中说明，模型列表照常可用。想让插件重新占用 `opencode-go`，请先停用那一项配置（通常是删除 `settings.yaml` 里 `llm-pi-ai.providers.opencode-go` 整段）。

> 注意与上一条区分：路由被占用的原因是**通用 pi-ai 配置里的静态模型表**，本包会换个路由继续服务（模型数仍为 38）；而**基线包**被安装的原因是同名插件共存，本包会完全退场。

### 没有出现预期的模型

先看日志里那行 `catalog resolved (...)`：

- `served` 比 `live listing` 少 → 看紧随其后的 `omitted` / `withheld` 行，那里会列出具体 ID
- `omitted` 非 0 → 该 ID 无法归入任何已知族，用 `catalogAdditions` 手工补
- 整行是 warn 且带"WITHOUT the live listing" → 实时目录获取失败，适配器在用本地表兜底；检查网络与设置页的模型发现

也可在高级设置中缩短"目录刷新（分钟）"让新模型更快出现。

## 功能说明

- **会话请求头**：每次请求包含 Harness User-Agent 和 `x-opencode-session`。同一会话保持相同 ID，无会话 ID 的请求使用独立随机值。
- **流式与历史**：支持流式输出、工具调用及历史回放，协议请求由 pi-ai 执行。
- **图片输入**：支持目录中声明图片能力的模型，需要 DSH attachment 服务。
- **提示与缓存**：插件不增加隐藏系统提示；会话 ID 用于网关路由。

## 卸载

从对应 profile 移除插件，再重启应用：

```sh
dsh plugin --profile web remove dsh-opencode-go-plus
# 或
dsh plugin --profile headless remove dsh-opencode-go-plus
```

## 更新日志

### 0.3.0

**变更：配置入口从独立的"设置 → OpenCode Go"分区，迁到"设置 → 模型"里的 OpenCode Go 行。**

此前插件的 Web 配置面是自己在设置侧边栏注册的一个分区，而"设置 → 模型"页面同时
又会从 `llm-pi-ai` 的 provider 目录里画出一行 OpenCode Go —— 同一个 provider 两个
入口，其中一个还管不了另一个。0.3.0 把这两处合并成一处：

| 层 | 改动 |
|---|---|
| `lib/index.js` | `apply()` 新增 `ctx.llm.registerConfigurableProviders(...)`，把本路由登记进可配置 provider 目录 |
| `lib/client.js` | 删除 `settings.section` 注册、喂它的 settings scope、以及刷新凭据徽标的 effect；会话输入区的额度 pill 保持不变 |
| `package.json` | `dsh.client.inject` 去掉 `@deepseek-ai/dsh-client-ui-settings`，该包也不再是 peer |

**这一行登记在 `opencode-go-plus` 这个路由上，这是刻意的。** provider 目录拒绝重复
声明，而 `opencode-go` **已经被 `@deepseek-ai/dsh-llm-pi-ai` 声明了**（它内置的
pi-ai 目录里就有同名路由）。在插件里再声明一次不是"这行不显示"这么轻 ——
`registerConfigurableProviders` 抛 `DUPLICATE_DIRECTORY`，异常从 `apply()` 里逸出，
**后面所有语句都不再执行**：路由不注册、设置段不安装，插件彻底失效。`opencode-go-plus`
在目录里是空的，而且它本来就是 `opencode-go` 被占用时本包实际服务的路由。

**行内提供什么**：显示名、路由、以及模型页自己的凭据绿点/红点（它读的是本段
`apiKeyEnv`，也就是插件真正在用的那把 key）。"编辑"卡片里是通用凭据字段，
`llm-opencode-go` 的其余字段（`refreshMinutes`、`autoDiscover`、图片预算、
`catalogAdditions`）按模型页的既定提示留在 `settings.yaml` 里手改，不做半吊子编辑。

### 0.2.1

**修复：浏览器端插件加载失败 / 整个 Web 界面白屏。**

0.2.0 的 `lib/client.js` 是从上游包 `dsh-opencode-go` 的源码编译的，包名改成
`dsh-opencode-go-plus` 后，脚本内硬编码的客户端模块注册 id 没有跟着改：

```js
// 0.2.0（错）
window.__ModuleLoader__.load({ id: "dsh-opencode-go", factory: ... })
// 0.2.1（对）
window.__ModuleLoader__.load({ id: "dsh-opencode-go-plus", factory: ... })
```

dsh 的客户端模块系统按下发的启动图条目 id 校验注册结果
（`dsh-client-modules` 的 `arrive()`：*bundle loaded without registering "&lt;id&gt;"*），
id 不匹配时宿主会重放该脚本兜底，脚本第二次执行撞上已注册的
`@deepseek-ai/dsh-api-gateway`，抛出
`duplicate factory registration for "@deepseek-ai/dsh-api-gateway"`，
并连带报 `dsh-opencode-go-plus: import failed` —— 表现为启动后只看到
「Failed to load plugins」白屏。

**影响范围**：仅 0.2.0。服务端（`lib/index.js`）不受影响，本包在 dsh 插件树里的
装配一直是正常的。

**未改动的部分**：脚本内的 CSS 作用域符号（`dsh-opencode-go/Section.module.css`）
与跨进程用量查询的 typert 符号（`dsh-opencode-go#GoUsage`、
`dsh-opencode-go#opencodeGoUsage/read`）保持原值 —— 后者必须与服务端 `lib/index.js`
成对匹配，且沿用旧符号以兼容既有配置。

### 0.2.0

首个 `dsh-opencode-go-plus` 版本：从 `Duskriver/dsh-opencode-go` 派生，
在同族适配器已占用 `opencode-go` 路由时仍保持模型目录可达，
并支持目录中未见过的新模型族。

## 来源与许可

本包是 [`Duskriver/dsh-opencode-go`](https://github.com/Duskriver/dsh-opencode-go) 的分支，
其适配器、设置 UI 与 `src/conversion/{context,stream,replay}.ts` 派生自
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，均为 MIT。
上游版权归各自作者所有；本分支新增的改动见 `docs/derivation.md`。

## 反馈

本分支的问题请提到 <https://github.com/HaydenSmith1121/dsh-plugins/issues>。

## 许可证

[MIT](LICENSE)
