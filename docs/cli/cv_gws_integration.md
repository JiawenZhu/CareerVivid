# CareerVivid + Google Workspace CLI 集成指南

CareerVivid CLI (`cv`) 现已与 [Google Workspace CLI](https://github.com/googleworkspace/cli) (`gws`) 进行了深度本地集成。通过在本地机器上进行安全的 OAuth 认证，你现在可以直接在终端中将 CareerVivid 的简历数据导出为 Google 文档，或者通过扫描 Gmail 自动生成求职追踪表格。

本指南将详细介绍如何从零开始配置环境并使用集成命令。

---

## 1. 初始前置配置 (Prerequisites)

由于涉及操作真实用户的 Google 云盘和邮箱数据，我们需要在本地机器上安装 `gws` 并进行授权。

### 1.1 安装 GWS CLI
首先全局安装 Google Workspace CLI：
```bash
npm install -g @googleworkspace/cli
```

### 1.2 执行本地化授权
运行以下命令以启动授权向导：
```bash
gws auth setup
```

**配置要点说明：**
- **GCP Project**: 创建或选择一个 GCP 项目（例如 `jastalk-firebase`）。
- **Workspace APIs**: 向导会自动提示你开启所需的 API。请务必勾选 `Google Drive`, `Google Sheets`, `Gmail`, `Google Calendar` 和 `Google Docs`。
- **OAuth Client ID**: 如果向导要求你输入 Client ID，说明你的环境需要手动签发 OAuth 客户端。
  1. 前往 GCP 控制台的 [Credentials 页面](https://console.cloud.google.com/apis/credentials)。
  2. 点击 **Create Credentials -> OAuth client ID**。
  3. **Application type 必须选择 "Desktop app" (桌面应用)**。
  4. 将生成的 Client ID 和 Client Secret 粘贴回终端的提示框中。

### 1.3 登录并保存 Token
最后运行：
```bash
gws auth login
```
终端会提供一个链接并打开浏览器。选择你的邮箱，确认给予权限。成功后，OAuth Token 将被永久加密保存在你的本地（例如 `~/.config/gws/credentials.enc`）。以后无需重复扫码即可全自动调用 API。

---

## 2. 核心功能与使用方法

完成环境配置后，你可以使用以下 `cv` 专属命令来体验无缝的办公自动化！

### 🦸‍♂️ 功能一：环境健康检查
在使用任何高级自动化之前，你可以随时测试当前的身份集成状态。

```bash
cv workspace check
# 或者使用别名：
cv gws check
```

**如果一切正常，终端将显示：**
> ✔ Google Workspace integration is fully configured.

---

### 📄 功能二：一键导出简历到 Google Docs
你可以将 CareerVivid 格式的求职简历 JSON 数据，自动导出排版成一份可供他人协作批注的新 Google 线上文档。

**命令：**
```bash
cv profile export --format gdoc [本地简历.json的可选路径]
```

**底层逻辑：**
1. CLI 首先调用 `gws docs documents create` 动态为你建立一个新的云端空文档。
2. 随后构造 `batchUpdate` JSON 格式的数据流，将解析后的体验、项目等经历完美渲染到刚才创建的 Docs 之中。
3. 执行完毕后，它会直接在终端抛出一个 `https://docs.google.com/document/d/.../edit` 的地址，点开即可查阅。

---

### 📧 功能三：自动抓取 Gmail 职位申请并生成 Sheets 追踪表
忘掉繁琐的手工填写求职记录表。只需一条命令，CLI 它会自动扫描你绑定邮箱中的最新投递收据，并将数据写入自动化生成的共享表格。

**命令：**
```bash
cv jobs sync-gmail
```

**底层逻辑：**
1. CLI 会通过 `gws gmail users messages list` 查询诸如 `subject:application OR subject:applied` 等高意向关键词，精确过滤出求职自动回复。
2. 利用大模型（AI Mocking）或者特定的正则对邮箱正文 `snippet` 进行抽取，获取公司名称、岗位头衔等核心元数据。
3. 调用 `gws sheets spreadsheets create` 生成一张专属的 `CareerVivid Job Tracker`。
4. 随后调用 `values append` API 将结构化的投递数据作为新的一行追加进 Sheets。

---

## 3. 常见问题 (Troubleshooting)

**Q: 运行 `cv workspace check` 时提示 `Exit code: 1` 或 `✖ GWS CLI is installed but not authenticated`。**  
A: 这表示你的本地缺少 `gws` 环境或者登录 Token 失效。请重新执行 `gws auth login`。如果在重定向时终端被 `Ctrl+C` 断开，请务必等它跑完全程并出现 `Success` 提示。

**Q: `cv jobs sync-gmail` 报告 `No recent application emails found.`**  
A: 很正常，这表示你的 Gmail 账户中最近没有符合规则特征的求职信（或是你在一个完全没有用来投递过简历的生活邮箱里做测试）。

**Q: 我的 Google 账号随时可以撤销这个命令行访问权限吗？**  
A: 可以。你可以随时进入 Google Account 的 **Security -> Third-party apps with account access**，找到你命名的应用名称并点击 "Remove access"。本地的 `cv` 便会立即丧失所有读写权限。
