# Curriculum Blueprint — Modules 5–10 (v2 · 动态微课时架构)

> 状态:待评审 → 批准后落地到 `data/courses/05–10` JSON
> 方法:所有课时切片均基于对 `third_party/learning-sources/` 一手素材的实测体量(字数/章节),不做臆测。

---

## 1. 设计方法论

**内容决定课时。** 每个模块的课时数由三个实测指标反推:

1. **素材体量** — 相关源章节的实际字数(下表)
2. **知识点独立性** — 一个课时只承载一个可独立掌握的概念簇(认知负荷 ≤ 1 个新心智模型/课)
3. **互动节奏** — 硬性节奏规则:
   - 不允许两个长阅读课相邻,中间必须插入 video / widget / quiz
   - 每个概念簇后 ≤2 课内必有一次检验(quiz 或 widget 完成条件)
   - 单课目标时长:阅读 6–8 min,视频 10 min,交互 6–8 min,quiz 4–5 min,代码实验 10–12 min
   - 模块总时长控制在 **45–75 min**(低于 45 学不扎实,高于 75 完课率断崖)

**已有资产全部保留**:现有 11 个交互组件、全部 code lab id(用户进度不丢失)、全部视频。新增课时以阅读+quiz 为主,不阻塞于新组件开发。

## 2. 素材密度实测(反推依据)

| 模块 | 相关源章节 | 实测字数 | 密度评级 |
|---|---|---|---|
| M5 Agent 架构 | HF unit1 (14,171) · MS agents 04-tool-use (2,236) · 07-planning (1,559) · 03-patterns (1,084) · 09-metacognition (7,667) · 12-context-eng (2,225) · 13-memory (1,732) · 01-intro (1,146) | **~31,800** | ★★★★★ 最密 |
| M6 多智能体 | 08-multi-agent (2,627) · 11-agentic-protocols (1,949) · 02-frameworks (2,821) · OpenAI Orchestrating_agents / Structured_outputs_multi_agent | **~8,400+** | ★★★★ |
| M7 评估与可观测 | HF bonus-unit2 观测与评估专题 (4,283) · OpenAI cookbook `evals/` · Claude cookbooks `evals/` | **~6,500+** | ★★★☆ |
| M8 安全 | GenAI 13-securing (2,554) · agents 06-trustworthy (1,778) · agents 18-securing/密码学回执 (3,279) | **~7,600** | ★★★★ |
| M9 部署 | agents 10-production (2,377) · GenAI 14-lifecycle (828) · Claude/Gemini quickstart 代码 | **~3,900** | ★★☆ 偏轻 |
| M10 毕业项目 | Claude quickstarts 参考应用(customer-support-agent、financial-data-analyst、agents)· 各家 cookbook | 代码为主 | ★★☆ 案例型 |

**结论:** M5 素材量是 M9 的 8 倍,固定 5 课时对 M5 是暴力压缩、对 M9/M10 是注水。动态分配如下。

## 3. 课时总量变化一览

| 模块 | 现课时 | 新课时 | 预估总时长 | 变化理由 |
|---|---|---|---|---|
| M5 Agent 架构 | 5 | **9** | ~65 min | 素材最密;工具调用/规划/记忆/上下文工程原先完全缺席 |
| M6 多智能体 | 5 | **7** | ~52 min | 新增 MCP/A2A 协议与框架选型(2025 年面试高频) |
| M7 评估与可观测 | 4 | **6** | ~45 min | HF 有专门的 observability 单元未被利用;补 LLM-as-judge |
| M8 安全 | 5 | **7** | ~54 min | 补信任框架/HITL + 审计回执(18 章全新素材) |
| M9 部署 | 5 | **6** | ~45 min | 素材偏轻,仅补 GenAIOps 生命周期一课,克制不注水 |
| M10 毕业项目 | 3 | **5** | ~55 min | 补参考应用拆解 + 交付清单;保持精炼,重心在白板实战 |
| **合计** | **27** | **40** | — | — |

---

## 4. 模块详细大纲

### M5 · Agent 架构(5 → 9 课,~65 min)

> 章节结构:3 章。原有 5 课全部保留,新增 4 个阅读/quiz 课时覆盖工具调用、规划模式、记忆与上下文工程(源素材中体量最大却未开课的部分)。

| # | 课时 | 类型 | 核心议题 | 主要素材 | 时长 |
|---|---|---|---|---|---|
| 1 | From chatbot to agent | reading(保留) | Agent 定义;Thought→Action→Observation 循环;四大器官 | HF unit1 · MS 01-intro | 7 min |
| 2 | Video: Intro to AI agents | video(保留) | model+tools+loop;工具描述的作用 | MS agents 01 | 10 min |
| 3 | Playground: You are the agent | interactive(保留) | 亲手路由工具;迭代预算;loop guard | 自研 widget | 6 min |
| 4 | Knowledge check: agent anatomy | quiz(保留) | 循环/守卫/工具描述 | — | 4 min |
| 5 | **Tool use & function calling**(新) | reading | 工具 schema 设计;名称与描述即路由提示词;参数校验;错误回传 | MS 04-tool-use (2,236w) | 7 min |
| 6 | **Planning & design patterns**(新) | reading | 任务分解;planner-executor;reflection/自我纠错(metacognition 精粹);corrective-RAG 案例 | MS 07-planning + 03-patterns + 09-metacognition | 7 min |
| 7 | **Memory & context engineering**(新) | reading | 短期/长期记忆;记忆写入策略;上下文工程三策略与常见失败(呼应 M2 截断) | MS 13-memory + 12-context-eng | 8 min |
| 8 | **Knowledge check: advanced agent design**(新) | quiz | 工具 schema / 规划模式 / 记忆取舍 场景题 ×4 | — | 5 min |
| 9 | Code lab: Route the right tool | code(保留,id 不变) | 实现 selectTool 路由 | 原有 | 12 min |

节奏检查:reading→video→widget→quiz→reading→reading(6/7 相邻,但 6 偏案例、7 偏策略,且 8 紧跟检验)→quiz→lab ✅

### M6 · 多智能体(5 → 7 课,~52 min)

| # | 课时 | 类型 | 核心议题 | 主要素材 | 时长 |
|---|---|---|---|---|---|
| 1 | Why teams beat heroes | reading(保留) | supervisor 模式;专业化+协调;交接风险 | MS 08-multi-agent | 7 min |
| 2 | Video: Multi-agent design patterns | video(保留) | 何时该用/不该用;handoff 携带状态 | MS agents 08 | 10 min |
| 3 | Playground: Mission control | interactive(保留) | 亲手当 supervisor 路由子任务 | 自研 widget | 6 min |
| 4 | **Agent protocols: MCP & A2A**(新) | reading | MCP 核心组件(host/client/server);A2A 智能体互通;NLWeb 一瞥;为什么标准化交接=结构化输出的延伸 | MS 11-agentic-protocols (1,949w) | 8 min |
| 5 | **Choosing an agent framework**(新) | reading | AutoGen / Semantic Kernel / smolagents / OpenAI Agents SDK 选型矩阵;什么时候裸写循环反而更好 | MS 02-frameworks (2,821w) | 6 min |
| 6 | Knowledge check: orchestration | quiz(保留,扩至 4 题) | 原 3 题 + 新增 MCP 场景题 | — | 5 min |
| 7 | Code lab: Assign the specialist | code(保留,id 不变) | 实现 assignAgent | 原有 | 10 min |

### M7 · 评估与可观测(4 → 6 课,~45 min)

| # | 课时 | 类型 | 核心议题 | 主要素材 | 时长 |
|---|---|---|---|---|---|
| 1 | Vibes don't scale | reading(保留) | eval 循环;四维 rubric;失败分类 | OpenAI/HF/Claude | 8 min |
| 2 | Playground: You are the grader | interactive(保留) | 按 rubric 给真实输出打分 | 自研 widget | 8 min |
| 3 | **Observability: traces & spans**(新) | reading | span/trace 概念;离线 vs 在线评估;监控看板该看什么;agent trace 即调试器 | HF bonus-unit2 (4,283w) | 7 min |
| 4 | Knowledge check: evals & traces | quiz(保留,扩至 4 题) | 原 3 题 + trace 定位场景题 | — | 5 min |
| 5 | **LLM-as-judge in practice**(新) | reading | judge prompt 写法;与人工标注对齐校准;judge 的系统性盲区;成本控制 | OpenAI cookbook `evals/` · Claude cookbooks `evals/` | 6 min |
| 6 | Code lab: Score an eval case | code(保留,id 不变) | 实现 scoreCase | 原有 | 10 min |

### M8 · 安全(5 → 7 课,~54 min)

| # | 课时 | 类型 | 核心议题 | 主要素材 | 时长 |
|---|---|---|---|---|---|
| 1 | Prompt injection: the untrusted-input problem | reading(保留) | 直接/间接注入;exfiltration;纵深防御 6 层 | GenAI 13-securing | 8 min |
| 2 | Video: Securing AI applications | video(保留) | AI 特有威胁分类 | GenAI 13 | 10 min |
| 3 | Game: Injection defender | game(保留) | Allow/Block 六张请求卡 | 自研 widget | 8 min |
| 4 | **Building trustworthy agents**(新) | reading | system-message 设计框架;威胁建模(任务劫持/权限滥用);Human-in-the-Loop 审批模式与断点设计 | MS 06-trustworthy (1,778w) | 6 min |
| 5 | **Audit trails & tamper-proof receipts**(新) | reading | Agent 行为审计难题;密码学回执(hash 链)如何证明"谁在何时做了什么";回执能证明什么/不能证明什么 | MS 18-securing (3,279w,全新素材) | 7 min |
| 6 | Knowledge check: agent security | quiz(保留,扩至 4 题) | 原 3 题 + HITL/审计场景题 | — | 5 min |
| 7 | Code lab: Allow safe tool requests | code(保留,id 不变) | 实现 allowToolRequest | 原有 | 10 min |

### M9 · 部署(5 → 6 课,~45 min)

> 素材实测偏轻(~3,900 词),克制扩张:只补一课生命周期,不注水。

| # | 课时 | 类型 | 核心议题 | 主要素材 | 时长 |
|---|---|---|---|---|---|
| 1 | A model call is not a product | reading(保留) | 慢/贵/不稳;四大控制 | quickstarts 综合 | 8 min |
| 2 | Video: AI agents in production | video(保留) | 生产监控与成本控制 | MS agents 10 | 10 min |
| 3 | Game: The control room | game(保留) | 三起事故 × cache/queue/rate-limit | 自研 widget | 7 min |
| 4 | **The GenAIOps lifecycle**(新) | reading | ideate→build→operationalize 循环;fallback 链与优雅降级实操;预算警报设计;发布前 checklist | GenAI 14-lifecycle + MS agents 10-production | 6 min |
| 5 | Knowledge check: ops instincts | quiz(保留) | p95/降级/成本蠕升 | — | 4 min |
| 6 | Code lab: Choose a deployment control | code(保留,id 不变) | 实现 chooseControl | 原有 | 10 min |

### M10 · 毕业项目(3 → 5 课,~55 min)

> 案例型模块:新增两课直接服务于"做出能面试的项目",重心仍是白板实战。

| # | 课时 | 类型 | 核心议题 | 主要素材 | 时长 |
|---|---|---|---|---|---|
| 1 | Beyond the thin wrapper | reading(保留) | 六大工程信号;三条路线 | 综合 | 8 min |
| 2 | **Dissecting two reference apps**(新) | reading | 拆解 Claude quickstarts 真实应用:customer-support-agent(RAG+工具+引用)与 financial-data-analyst(多模态+图表生成)的架构决策逐层讲解 | anthropic-claude-quickstarts | 7 min |
| 3 | Knowledge check: defend your design | quiz(保留) | 面试式架构答辩 | — | 4 min |
| 4 | **The ship checklist**(新) | reading | README 结构(eval 表格/架构图/成本数据);录 demo;trace 截图;如何在面试中讲这个项目(STAR 化) | quickstarts README 惯例 + M7 评估资产 | 6 min |
| 5 | Whiteboard: Draw your capstone architecture | whiteboard(保留,id 不变) | 画出可答辩的架构图 | 原有 | 20 min |

---

## 5. 落地说明

- **零迁移风险**:全部改动只需编辑 6 个 JSON 文件;code lab / whiteboard 的 exercise id 不变,已有用户进度与 XP 兼容(完成度按新总数重新计算,属预期行为)。
- **无新组件依赖**:9 个新增课时均为 reading/quiz,现有 11 个 widget 已覆盖各模块的互动锚点;后续可选增强(不阻塞):M5 "tool-schema 检查器"、M7 "trace 瀑布图查看器"。
- **XP 建议**:新增阅读 15 XP、新增 quiz 20 XP,与现行标准一致。
- **署名合规**:全部新课时素材来自 MIT / Apache-2.0 仓库,沿用现行 attribution 字段格式。
