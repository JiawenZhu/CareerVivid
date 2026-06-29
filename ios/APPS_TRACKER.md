# CareerVivid — App Portfolio Tracker

> 策略：优先高流量品类，用现有 AI 模拟 + 多语言 + 题库基础设施快速复用。
> 先发布前两款测市场，再根据数据决定下一步。

---

## App Roster

| # | App | 品类 | Status | 流量规模 | 竞争 |
|---|-----|------|--------|---------|------|
| 1 | VisaInterviewPrepMVP | 签证面试 | ✅ Complete | ⭐⭐⭐ 中高 | 低 |
| 2 | GreenCardInterviewMVP | 绿卡面试 | 🔄 In Progress | ⭐⭐ 中 | 极低 |
| 3 | DMVTestPrepMVP | 驾照笔试 | 📋 Planned | ⭐⭐⭐⭐⭐ 极高 | 高（可打） |
| 4 | IELTSSpeakingMVP | 雅思口语 | 📋 Planned | ⭐⭐⭐⭐ 高 | 中 |
| 5 | JobInterviewMVP | 求职面试 | 📋 Planned | ⭐⭐⭐⭐⭐ 极高 | 高（可打） |
| 6 | CitizenshipTestMVP | 入籍考试 | 📋 Planned | ⭐⭐⭐ 高 | 中高 |
| 7 | AINotetakerMVP | AI 笔记 | 📋 Planned | ⭐⭐⭐⭐⭐ 极高 | 高（有缺口） |
| 8 | AIExpenseTrackerMVP | AI 记账 | 📋 Planned | ⭐⭐⭐⭐⭐ 极高 | 高（高挫败感） |

---

## 市场地图（调研结果）

### 🔴 超高流量 — 值得硬打

**驾照笔试（DMV）**
- DMV Genie 单个 app：8M+ 用户，$200K/月收入，40K 次/月下载
- 每年数百万新驾驶员（青少年考照 + 新州迁居）
- 竞品强，但 AI 自适应题库 + 语音解释 = 可打

**求职面试（Job Interview）**
- 市场规模 $2.5B → 2031 年 $6.3B（CAGR 11.8%）
- Interview Pilot 自称 App Store #1，10万+ 用户
- 竞争激烈，但我们的 AI 模拟 + 行业定制可以差异化

### 🟠 高流量 — 竞争适中，AI 有明显缺口

**雅思/托福口语（IELTS/TOEFL Speaking）**
- App Store 232+ 款雅思 app，但口语 AI 评分几乎没有
- 全球数百万考生，中国/印度/东南亚市场尤其大
- 我们的 AI 对话引擎直接复用

**美国入籍考试（Citizenship Test）**
- 每年约 90 万人参加入籍考试
- 已有竞品（US Citizenship Test Plus 等），但无 AI 模拟
- 100 道官方公民题 + 英语口语测试 = 完美 app 结构

### 🟡 中等流量 — 低竞争，值得关注

**婚姻绿卡面试（Green Card）** 🔄
- 唯一竞品：一款 $1.99 静态 150 题 app
- 受众情绪高度紧张，付费意愿强

**真实口语对话练习（Language Speaking）**
- Duolingo 口语功能弱，Elsa Speak 仅发音
- "AI 陪练对话"几乎是空白
- 可作为 IELTS app 的自然延伸

---

## 1. VisaInterviewPrepMVP ✅

**Bundle ID:** `app.visainterviewprep.mvp`
**Target:** US non-immigrant visa applicants (B1/B2, F-1, H-1B, J-1)
**Status:** Complete — running on iPhone 17 Pro (iOS 26.5)

### Features Shipped
1. Visa Type Selector — B1/B2, F-1, H-1B, J-1
2. Static Q&A Bank — 11 questions/type, category filters
3. Document Checklist — 13 items grouped by category
4. AI Mock Interview — Officer modes (Friendly/Professional/Strict), timer
5. Model Answer Library — searchable with category filter
6. Officer Personality Modes
7. Readiness Score + History — gauge, sparkline, session log
8. Multilingual — English, Español, 中文, Français

### Key Files
- `Sources/VisaInterviewPrepMVP/` — all Swift source
- `VisaInterviewPrepMVP.xcodeproj` — **always open this, NOT Package.swift**

---

## 2. GreenCardInterviewMVP 🔄

**Target:** Marriage-based green card couples (I-485 + USCIS joint interview)
**Competition:** 1 weak app at $1.99, 150 static questions — bar is extremely low

### Planned Features
- [ ] Q&A bank: relationship history, finances, daily life, future plans
- [ ] Document checklist (I-485, I-130, I-864, medicals, joint evidence)
- [ ] Officer personality modes
- [ ] Mock interview (solo + couples mode)
- [ ] Readiness score + history
- [ ] Multilingual (Spanish, Chinese, Hindi, Portuguese)

---

## 3. DMVTestPrepMVP 📋

**Target:** Teen drivers + new state residents taking written permit test
**Market:** DMV Genie = 8M users, $200K/month — largest test prep market on iOS
**Edge:** AI explanation for every wrong answer + voice mode for accessibility

### Planned Features
- [ ] 600+ state-specific questions (all 50 states)
- [ ] AI "explain why I got this wrong" for every question
- [ ] Voice mode (accessible while studying hands-free)
- [ ] Progress tracking by topic (signs, rules, limits)
- [ ] Mock test simulator with pass/fail threshold
- [ ] Motorcycle + CDL modules

---

## 4. IELTSSpeakingMVP 📋

**Target:** IELTS/TOEFL candidates globally (China, India, SE Asia primary markets)
**Market:** 232+ IELTS apps on App Store, but zero with real AI speaking evaluation
**Edge:** AI scores each response on fluency, coherence, vocabulary, pronunciation

### Planned Features
- [ ] Part 1/2/3 question bank (IELTS Speaking structure)
- [ ] AI speaking evaluator — band score estimate per response
- [ ] Follow-up question AI (Part 3 discussion simulation)
- [ ] Vocabulary suggester — "you could have used: elaboration, perspective…"
- [ ] Recording playback with annotated feedback
- [ ] TOEFL Integrated/Independent speaking tasks

---

## 5. JobInterviewMVP 📋

**Target:** Job seekers across industries — entry level to senior
**Market:** $2.5B → $6.3B by 2031. Interview Pilot claims 100K+ users already.
**Edge:** Industry + role specific (not generic) — Software, Finance, Healthcare, Marketing

### Planned Features
- [ ] Role-specific Q&A banks (SWE, PM, Nurse, Sales, Finance, Marketing)
- [ ] STAR method coach with AI scoring
- [ ] Behavioral + technical question modes
- [ ] Company-specific prep (FAANG, consulting, banking)
- [ ] AI interviewer with personality modes
- [ ] Salary negotiation simulator

---

## 6. CitizenshipTestMVP 📋

**Target:** US naturalization applicants (N-400 process)
**Market:** ~900K naturalizations/year. Competitive but AI simulation is the gap.
**Edge:** 100 official USCIS questions + English reading/writing test simulation + civics interview

### Planned Features
- [ ] 100 official USCIS civics questions + 28 expanded
- [ ] AI officer simulation (actual N-400 interview format)
- [ ] English reading test (USCIS word list)
- [ ] English writing dictation practice
- [ ] N-400 personal history Q&A prep (Parts 10–12)
- [ ] Multilingual explanations (Spanish, Chinese, Tagalog, Vietnamese, Arabic)

---

## 7. AINotetakerMVP 📋

**品类:** AI 会议/课堂笔记
**市场规模:** $11B（2025）→ $28B（2030），CAGR 20.5%
**竞品:** Otter, Fireflies, Notion AI, Granola, Jamie — 全部以 meeting bot 为主，iOS 是二等公民

**我们的切入角度 — "无 Bot，放手机在桌上就能用"**
- 竞品痛点：需要 bot 加入会议（Zoom/Teams），有人看到 bot 会不舒服；对 in-person 会议完全没用
- 我们做：手机放桌上 → 录音 → AI 自动整理笔记，完全不需要 bot
- 额外缺口：多语言转录（中英混合）、医疗/法律等专业术语、隐私优先（可选本地处理）

### Planned Features
- [ ] 一键录音 → AI 实时转录（支持中英混合）
- [ ] 自动生成摘要 + 行动项（Action Items）
- [ ] Speaker 识别（"张三说了…""客户说了…"）
- [ ] 多语言支持（中文、英文、西班牙语）
- [ ] 隐私模式（不上传音频，本地处理）
- [ ] 导出到 Notion / 备忘录 / PDF
- [ ] 课堂模式（学生场景：讲座、补课、讨论）

---

## 8. AIExpenseTrackerMVP 📋

**品类:** AI 个人记账
**市场规模:** 记账 app 市场 $3.76B（2023）→ $10.24B（2032）；个人金融整体 $165B → $207B（2026）
**竞品:** Mint（已关闭）, YNAB, Monarch Money, PocketGuard, Rocket Money, Cleo
**用户挫败感极高（= 机会）:** 银行连接复杂、不支持信用合作社、现金记录缺失、UI 臃肿

**我们的切入角度 — "拍一张收据，AI 自动记好一切"**
- 不强制连接银行（解决隐私顾虑，直接攻竞品最大痛点）
- 拍照扫描收据 → AI 识别金额/商家/类别，一键确认
- 语音输入："我刚花了 23 块吃午饭" → 自动记录
- AI 每周生成花费分析 + 趋势图 + 超支预警

### Planned Features
- [ ] 📷 拍收据 → AI OCR 自动解析（金额、商家、类别）
- [ ] 🎙️ 语音记账（"花了多少在什么上"）
- [ ] ✍️ 手动快速记录（滑动输入，极简 UI）
- [ ] 🏦 可选银行连接（Plaid）自动同步
- [ ] 📊 AI 周报 / 月报（你在哪些类别超支了）
- [ ] 🎯 预算设置 + 超支预警
- [ ] 💬 AI 对话查询（"我这个月在餐厅花了多少？"）
- [ ] 多货币支持（适合出行 / 海外华人）
- [ ] 多语言（中文 UI）

---

## Dev Infrastructure (Shared)

- **Monorepo:** `/Users/jiawenzhu/Developer/careervivid-release/ios/`
- **Stack:** SwiftUI, iOS 17+, SPM + xcodeproj hybrid
- **Auth:** Firebase Identity Toolkit REST (no SDK needed)
- **AI:** Real-time agent for mock interview/speaking evaluation
- **Always open `.xcodeproj`**, never `Package.swift`

## Reusable Modules Across All Apps
| Module | Used in |
|--------|---------|
| AI Mock Interview engine | All 6 apps |
| Q&A bank + category filter | All 6 apps |
| Document checklist | 1, 2, 3 |
| Readiness score + history | All 6 apps |
| Multilingual support | All 6 apps |
| Officer/examiner personality modes | 1, 2, 5, 6 |
