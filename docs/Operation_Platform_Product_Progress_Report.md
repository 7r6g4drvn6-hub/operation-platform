# Operation Platform 产品进度与交付路线汇报

汇报日期：2026-09-04  
汇报对象：产品、Operation、Backend、Frontend、Probe 和管理团队  
项目版本：V1.2 Prototype 及真实闭环交付准备

## 一、汇报结论

当前产品已经完成从 Incident 管理页面向 Evidence driven Operation Platform 原型的产品骨架升级，并已发布到 GitHub Pages，任何人都可以在线查看。原型能够演示：

```text
Detect → Understand → Act → Verify → Outcome
```

当前完成的是 UI、信息架构、领域模型、Mock Data 和交互演示，不是生产系统。生产化尚未开始，核心缺口是 PostgreSQL、正式 API、Backend 状态机、鉴权、真实 Probe 回调、服务端审计和前端 API 迁移。

下一步必须按以下顺序推进：

```text
数据库 → API → Backend → Probe 接入 → 前端改造 → 第一条真实闭环 → 验收
```

## 二、当前交付状态

| 能力 | 当前状态 | 已完成内容 | 生产化缺口 |
| --- | --- | --- | --- |
| 产品模型 | 已完成原型 | Signal、Incident、Problem、Operation、Action、Probe、Evidence、Verification、Outcome、History | 落到服务端实体和约束 |
| Command Center | 已完成原型 | Critical/High Risk、Unreported Problems、Active Operations、Verification attention | 仍读取浏览器 Mock State |
| Problem Detail | 已完成原型 | Impact、Signals、Incidents、Probe、Availability、Recommendation、Active Operations、Timeline | 推荐逻辑需要服务端规则和真实 Evidence |
| Operation Detail | 已完成原型 | Objective、Owner、Actions、Progress、Evidence、Verification、Outcome | 需要后端状态机和权限控制 |
| Unreported Problem | 已完成原型 | Probe 异常且无 Backend Incident 的问题可以单独展示和推进 | 需要真实 Signal ingestion 和 Problem API |
| Probe 边界 | 已定义并演示 | Probe 保持独立，作为 Evidence Generator | 尚无真实出站请求和回调 |
| Closed loop | 可演示 | Failed Verification 不关闭；Passed Verification 产生 Outcome | 尚无事务一致性和数据库审计 |
| Mock Data | 已完成 | China / MIB3 Approval、Problems、Incidents、Probe Results、Operations、Actions、Evidence | 不能作为生产数据源 |
| 文档和架构图 | 已完成 | V1.1 API、Data Flow、Overview 图及交付计划 | 转化为 OpenAPI、ERD 和运行手册 |
| GitHub 发布 | 已完成 | Public repository 和 GitHub Pages 在线预览 | GitHub Pages 只适合静态 Prototype |

## 三、已经完成了什么

### 3.1 产品定位和核心原则

产品已经明确不是另一个 Incident Management Dashboard，而是以 Evidence 为核心的运营闭环平台：

```text
Signal → Problem → Operation → Action → Evidence → Verification → Outcome
```

已经固化的判断包括：

- Incident 是 Signal Source，不是唯一入口。
- Problem 可以在 Incident 数量为 0 时存在。
- Probe 是独立产品，不复制 Probe 执行逻辑。
- Action 完成不等于 Operation 完成。
- 只有通过明确 KPI 验证的 Verification 才能创建 Outcome。
- Overview 解释结果和业务影响，Command Center 负责当前注意力和风险排序。

### 3.2 当前前端原型

当前页面和路由覆盖：

```text
China Operation Overview
Command Center
Signals
Problem List / Detail
Operations / Detail
Evidence
Incidents
Probe
Outcome Detail
Closed-loop History
```

重点交互已经具备：

- Problem Detail 中的 Recommended Next Action。
- Problem Detail 中的 Active Operations、负责人、状态、进度和 Actions。
- Command Center 中的一等 Unreported Problems 区域。
- Signal → Problem → Operation → Action → Probe → Evidence → Verification → Outcome 导航。
- Verification Failed 后保持 Operation 在 Verifying，并建议 Corrective Action。
- Verification Passed 后显示 Outcome、Before/After 和业务影响。

### 3.3 真实场景 Mock Data

```text
Service: MIB3 Approval
Region: China
Journey: Approval Download
Initial Probe failure rate: 12.8%
Initial Availability: 96.1%
Target failure rate: < 1%
Target Availability: > 99.7%
Initial Incident count: 0
```

该场景明确展示了“Probe 已经发现问题，但 Backend 尚未创建 Incident”的差异化能力。

### 3.4 GitHub 交付

- 代码仓库：[github.com/7r6g4drvn6-hub/operation-platform](https://github.com/7r6g4drvn6-hub/operation-platform)
- 在线 Prototype：[7r6g4drvn6-hub.github.io/operation-platform](https://7r6g4drvn6-hub.github.io/operation-platform/)
- 分支：`main`
- 本地运行：`node server.js`

GitHub Pages 当前发布的是静态 UI Prototype。每个访问者使用自己的浏览器 Mock State，数据不会在访问者之间同步，也没有真实 API、数据库或生产鉴权。

## 四、当前实现架构

当前架构用于快速验证产品模型和用户流程：

```text
访问者浏览器
      ↓
GitHub Pages 或本地 server.js
      ├── index.html
      ├── styles.css / styles-v11.css / styles-v12.css
      ├── app.js（Hash router 和页面渲染）
      ├── prototype-state.js（Mock State）
      └── api/ mock adapters
              ↓
       Browser local state
              ├── Signals
              ├── Problems
              ├── Operations / Actions
              ├── Evidence / Verification
              └── Outcomes / History
```

优点是启动快、适合演示和验证信息架构；缺点是没有跨用户一致性、服务端权限、可靠事件接入和审计能力。

### 当前 Prototype 架构图

![当前 Prototype 运行架构](architecture/Operation_Platform_V1.1_Overview_Architecture.png)

## 五、目标生产架构

第一版生产后端建议采用模块化单体，保持现有领域模型和 Probe 独立边界：

```text
┌─────────────────────────────────────────────────────────────┐
│ External Signal Sources                                     │
│ Probe · Availability · Incident · SMO · Release · KPI       │
└──────────────────────────┬──────────────────────────────────┘
                           │ authenticated events
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Operation API                                                │
│ Gateway · Auth · Validation · Idempotency · Trace ID         │
└──────────────┬──────────────────────────┬───────────────────┘
               ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│ Integration Adapters     │   │ Domain Commands and Queries  │
│ raw event → normalized   │   │ Signal · Problem · Operation │
│ event                    │   │ Action · Evidence · Outcome │
└──────────────┬───────────┘   └──────────────┬──────────────┘
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL Source of Truth                                  │
│ source_events · signals · problems · operations · evidence   │
│ verification_runs · outcomes · history_events · outbox       │
└──────────────┬────────────────────────────────────────────────┘
               ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│ Correlation and Rules    │   │ Probe Integration Boundary   │
│ service/region/time      │◄──┤ request run · callback result│
│ window/metric context    │   │ Probe remains independent   │
└──────────────┬───────────┘   └──────────────┬──────────────┘
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Problem → Operation → Action → Evidence → Verification      │
│                              └──────────────→ Outcome        │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Read Models and UI                                           │
│ Command Center · Problem Detail · Operation Detail           │
│ China Overview · Evidence · Outcome · Closed-loop History   │
└─────────────────────────────────────────────────────────────┘
```

### 目标 API 架构图

![Operation Platform V1.1 API Architecture](architecture/Operation_Platform_V1.1_API_Architecture.png)

### 目标数据流图

![Operation Platform V1.1 Data Flow](architecture/Operation_Platform_V1.1_Data_Flow.png)

## 六、详细闭环流程

### 6.1 主路径

```text
1. Signal detected
   Probe、Availability、Incident 或其他来源产生原始事件
        ↓
2. Event stored and normalized
   保存 source event，校验、去重，再生成统一 Signal
        ↓
3. Problem correlated
   按服务、地区、环境、时间窗口和指标上下文形成候选
        ↓
4. Problem understood
   Operation Manager 查看 Impact、Evidence、Incident 和推荐动作
        ↓
5. Operation created
   写入 Objective、Owner、KPI、Expected Outcome 和 Evidence Requirement
        ↓
6. Action assigned
   Backend、Probe Ops 或 Product 承担有明确 Expected Result 的任务
        ↓
7. Fix or action completed
   记录 Actual Result，必要时关联 Action Evidence
        ↓
8. Verification Probe executed
   Probe 独立执行，Operation 只接收 Probe Result
        ↓
9. Evidence comparison
   服务端比较 target snapshot 与 actual snapshot
        ↓
10. Outcome decided
    只有授权人显式 PASS 才能创建 Outcome
        ↓
11. Problem resolved
    Operation 完成、Problem 解决、Signals 归档、History 追加
```

### 6.2 失败验证路径

```text
Verification result = 4.8% failure rate
              ↓
Verification FAILED
              ├── Operation remains VERIFYING
              ├── Problem remains open
              ├── No Outcome created
              ├── Corrective Action becomes available
              └── New Verification Run can be started
```

### 6.3 通过验证路径

```text
Corrective Action completed
              ↓
Verification Probe = 0.4% failure rate
Availability = 99.8%
              ↓
Authorized reviewer records PASS
              ↓
One transaction updates:
Verification PASSED · Outcome VERIFIED · Operation COMPLETED
Problem RESOLVED · Signals ARCHIVED · History appended · Outbox created
              ↓
China Operation Overview refreshed
```

## 七、当前实现与生产目标的差距

| 差距 | 当前情况 | 影响 | 解决阶段 |
| --- | --- | --- | --- |
| Source of truth | 浏览器 local state | 刷新、换设备、换用户后不共享 | 数据库、Backend |
| API | Prototype mock adapters | 无稳定契约，前后端无法并行交付 | API |
| Persistence | 无 PostgreSQL | 无法审计、对账、恢复 | 数据库 |
| State machine | 主要由前端函数驱动 | 客户端可能绕过规则 | Backend |
| Authentication | 无生产鉴权 | 无法区分角色和集成来源 | API、Backend |
| Idempotency | 未对真实事件持久化去重 | Probe 重试可能重复生成对象 | 数据库、Probe |
| Correlation | Mock rule 结果 | 无服务端候选、置信度和配置 | Backend |
| Probe integration | 仅模拟 Run Probe | 无真实 runId、callback、重试、对账 | Probe 接入 |
| Evidence calculation | Mock 数字 | 无法证明真实 KPI 改善 | Backend、真实闭环 |
| Dashboard aggregation | 读取 Mock collections | 生产统计不能独立硬编码 | Backend Overview |
| Audit | Prototype History | 不满足 append-only 审计 | 数据库、Backend |
| Deployment | 只有静态 Pages | 不能承载 API、数据库和密钥 | Backend 基础设施 |

## 八、下一步交付路线

### Step 1 数据库

目标：把 Prototype State 替换为 PostgreSQL source of truth。

交付：八组迁移文件、China / MIB3 seed、schema、ERD、迁移和完整性测试。

门禁：从零迁移和回滚成功；Unreported Problem 可在 Incident 为 0 时保存；Probe callback 幂等；无 PASSED Verification 的 Outcome 不能插入；History append-only。

### Step 2 API

目标：冻结 OpenAPI，让 Backend、Frontend 和 Probe 并行实现。

核心接口：

```text
POST /api/v1/integrations/probe/results
POST /api/v1/integrations/availability/events
POST /api/v1/integrations/incidents/events
GET  /api/v1/signals
POST /api/v1/problems/from-signals
GET  /api/v1/problems/{problemId}
GET  /api/v1/problems/{problemId}/recommendation
POST /api/v1/operations
POST /api/v1/operations/{operationId}/probe-runs
POST /api/v1/operations/{operationId}/verification-runs
POST /api/v1/verification-runs/{verificationId}/decision
GET  /api/v1/overview/regions/{regionCode}
GET  /api/v1/command-center?region=CN
```

门禁：OpenAPI lint 零错误；mutation 写清状态、角色、幂等、错误码和 History 行为；Probe Owner、Frontend、Product 完成字段签字。

### Step 3 Backend

目标：实现服务端状态机、领域服务、相关性规则、聚合查询和审计。

```text
服务基础和鉴权
→ 幂等集成接入
→ Signal / Correlation / Problem
→ Operation / Action 状态机
→ Evidence / Verification / Outcome
→ Overview / Command Center / History / Outbox
```

### Step 4 Probe 接入

目标：证明 Operation 与 Probe 是两个产品，且结果可安全、幂等地转成 Evidence。

必须确认 `clientRequestId`、`runId`、`eventId`、用途、上下文、目标指标、callback 鉴权、重试、时钟偏差和 retention；实现出站请求、回调、结果分类、重试和 reconciliation。

### Step 5 前端改造

目标：保留当前视觉语言和信息架构，只把业务读写从 local state 切换到 API。

```text
Overview → Command Center → Signal → Problem → Operation → Evidence / Outcome / History
```

生产模式要求：不加载 `prototype-state.js`，不读写业务 localStorage，所有命令显示服务端状态，并具备 Loading、Empty、Error、Unauthorized、Stale、Retry 状态。

### Step 6 第一条真实闭环

固定场景：China / MIB3 Approval / Approval Download。

```text
真实 Probe 异常 12.8%
→ Signal
→ Unreported Problem
→ Operation
→ Diagnostic Action
→ Diagnostic Evidence
→ Backend Fix Evidence
→ Verification 4.8%（失败 rehearsal）
→ Corrective Action
→ Verification 0.4%（通过）
→ Outcome → Resolved Problem → Completed Operation
→ China Overview 更新
```

### Step 7 最终验收

管理层仅通过 Overview 和 Command Center 就能回答当前健康、风险、未报告问题、执行中的 Operation、已解决 Problem、结果证据和 KPI 改善。

## 九、第一条真实闭环验收口径

### 通过条件

- Probe 异常来自独立 Probe 环境，不是数据库 seed。
- 事件通过真实 API 接收并持久化。
- Problem 可在 Incident count 为 0 时创建。
- Problem Detail 展示 Recommendation、Evidence、Active Operation 和 Timeline。
- Failed Verification 不创建 Outcome、不解决 Problem。
- Corrective Action 后的 Passed Verification 只创建一个 Outcome。
- PASS 事务同时更新 Verification、Outcome、Operation、Problem、Signals、History、Outbox。
- Overview 数字可与明细和数据库记录对账。
- 没有人工修改数据库 status。

### 必须留存的证据

```text
execution-log.md
api-transcript.json
entity-ids.json
database-checks.sql
screenshots/
probe-result-links.md
known-issues.md
```

## 十、风险、依赖和需要确认的事项

| 项目 | 风险或依赖 | 需要确认 |
| --- | --- | --- |
| Probe 合同 | 是否支持 context、callback、签名、重试和 result URL | Probe Owner、Security |
| KPI 定义 | failure rate、availability、单位和时间窗口必须一致 | Product、Probe、Backend |
| 权限 | 谁能创建 Problem、记录 PASS、取消 Operation | Product、Security、Operation |
| 部署环境 | PostgreSQL、密钥、OIDC、域名和网络白名单 | Backend、IT、Security |
| 数据保留 | raw payload、History、Evidence 的保留期限 | Security、Compliance |
| 真实窗口 | China Production 的 Probe 执行和回滚联系人 | Operation、Backend、Probe |

## 十一、项目文件地图

```text
operation-platform/
├── index.html                         # 页面壳和脚本入口
├── app.js                             # Hash router 和页面渲染
├── prototype-state.js                 # 当前 Prototype Mock State
├── api/                               # 当前 Signal mock adapters
├── styles.css                         # 现有视觉基础
├── styles-v11.css / styles-v12.css    # 版本增量样式
├── server.js                          # 本地静态开发服务器
├── docs/architecture/                 # API、Data Flow、Overview 架构图
├── docs/Operation_Platform_Execution_Backlog.md
└── docs/Operation_Platform_Real_Closed_Loop_Delivery_Plan.md
```

## 十二、最终判断

项目已经完成“产品方向验证”和“可公开查看的 UI Prototype”，下一阶段不是继续堆页面，而是把已有模型变成可审计、可重放、可验证的服务端闭环。

真正的生产完成标准不是页面数量，而是下面这条链路可以被 API、数据库和 UI 同时证明：

```text
Detect → Understand → Act → Verify → Outcome
```

只要仍然存在浏览器 local state、手工改状态、Probe 结果无法对账或失败 Verification 可以误关闭 Operation，就不能称为 Operation Platform 生产闭环已经完成。
