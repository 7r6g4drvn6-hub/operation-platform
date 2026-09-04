# Operation Platform V1.2 可直接交付执行包

版本：1.0  
日期：2026-09-04  
适用范围：从当前 UI Prototype 交付到第一条真实 China / MIB3 Approval 闭环

本文是执行清单，不改变现有产品模型、页面结构或 Probe 的独立边界。

```text
数据库 → API → Backend → Probe 接入 → 前端改造 → 第一条真实闭环 → 验收
```

## 0. 当前基线与最终目标

### 当前基线

- UI Prototype 可运行，入口为 `http://localhost:4174/#/overview`。
- 当前业务数据来自 `prototype-state.js` 和浏览器本地状态。
- 已有 Signal、Problem、Operation、Action、Evidence、Verification、Outcome 的演示链路。
- 已有 Unreported Problem、Recommended Next Action、Active Operation、Timeline、China Overview 等页面表达。
- 还没有生产数据库、正式 API、服务端状态机、真实 Probe 回调或生产鉴权。

### 最终目标

下面这条链路必须能够通过真实 API、数据库记录和 UI 链接逐项证明：

```text
真实 Probe Event
→ Signal
→ Unreported Problem
→ Operation
→ Action
→ Probe / Release / Availability Evidence
→ Failed Verification
→ Corrective Action
→ Passed Verification
→ Verified Outcome
→ Resolved Problem
→ Completed Operation
→ China Operation Overview 更新
→ Append-only Closed-loop History
```

### 不可改变的产品规则

- `Incident` 只是 Signal Source，Problem 不要求必须有 Incident。
- `Probe` 是独立产品和 Evidence Generator，Operation 只保存引用并消费结果。
- Action 完成不能直接完成 Operation。
- 只有通过显式 KPI 验证的 Verification 才能创建 Outcome。
- Verification 失败时，Operation 保持 `VERIFYING`，不创建 Outcome，不解决 Problem。
- Overview 是结果和业务影响视图；Command Center 是当前注意力和风险视图。

## 1. 交付总表

| 阶段 | 可分派交付包 | 阶段输出 | 阶段门禁 |
| --- | --- | --- | --- |
| 数据库 | DB-01 ～ DB-06 | 可迁移 PostgreSQL、约束、种子、ERD、DB 测试 | 从零迁移、回滚、完整性和幂等测试通过 |
| API | API-01 ～ API-04 | OpenAPI 3.1、示例、错误码、生成客户端 | OpenAPI lint 通过，产品/前端/Probe 签字 |
| Backend | BE-01 ～ BE-06 | 模块化单体服务、状态机、聚合查询、审计 | API 集成测试通过，不依赖浏览器状态 |
| Probe 接入 | PRB-01 ～ PRB-03 | 出站请求、回调、幂等、重试和对账 | Sandbox 结果只落一次并转为 Signal/Evidence |
| 前端改造 | FE-01 ～ FE-04 | API 读取/写入、刷新、错误状态、回归测试 | 生产模式不读写 localStorage |
| 第一条真实闭环 | E2E-01 ～ E2E-04 | China / MIB3 Approval 执行包和证据 | PASS/FAIL 两条路径均可审计 |
| 最终验收 | ACC-01 | 签字清单、性能/安全/运行手册 | 所有阻断项清零 |

交付原则：每个交付包先产出文件和测试证据，再进入下一个依赖它的包；不允许通过手工改数据库状态代替业务命令。

## 2. Step 1：数据库

### DB-01：数据库工程骨架

负责人：Backend Engineer / DBA  
依赖：无

交付物：

```text
backend/db/migrations/001_extensions.sql
backend/db/migrations/002_reference_tables.sql
backend/db/migrate.ts
backend/db/rollback.ts
backend/db/schema.md
backend/db/erd.mmd
docker-compose.yml（PostgreSQL 服务）
.env.example
```

完成定义：

- 新环境可以从零执行 `migrate`。
- 应用启动时检查数据库版本，不接受缺失迁移。
- `rollback` 可以回退最近一个版本，且不会静默丢数据。
- ERD 与实际表结构一致。

证据：迁移日志、回滚日志、`schema diff` 结果。

### DB-02：Signal 和来源事件

交付物：

```text
backend/db/migrations/003_signal_and_source_events.sql
backend/test/db/source-events.test.ts
backend/test/db/signals.test.ts
```

必须实现：

- `signal_sources`、`source_events`、`signals`。
- `UNIQUE(source_id, external_event_id)`。
- `UNIQUE(source_id, idempotency_key)`。
- 原始 payload 在规范化前保存。
- 所有数值指标同时保存 `value` 和 `unit`。

验收用例：同一个 Probe event 重放 20 次，最多产生一个 source event 和一个 Signal。

### DB-03：Problem、Incident 和关系表

交付物：

```text
backend/db/migrations/004_problem_and_links.sql
backend/test/db/unreported-problem.test.ts
```

必须实现：

- `incidents`、`problems`、`problem_signals`、`problem_incidents`。
- 关系表使用复合主键，禁止重复关联。
- Problem 可在 Incident 数量为 0 时保存 `unreported = true`。
- 关联或解除 Incident 后，`unreported` 由服务端重新计算。

验收用例：只有 Probe/Availability 的两个 Signal 可以创建 Problem；该 Problem Detail 返回 `Incident count = 0`。

### DB-04：Operation 和 Action

交付物：

```text
backend/db/migrations/005_operation_action.sql
backend/test/db/operation-action-integrity.test.ts
```

必须实现：

- Operation 必填：Problem、Objective、Owner、KPI target、Expected Outcome、Evidence Requirement。
- Action 必填：Operation、Owner、Expected Result。
- `version` 字段用于乐观锁。
- 禁止通过 FK 删除领域对象；使用状态关闭或取消。

验收用例：缺少 KPI、Owner 或 Expected Result 的写入被拒绝；并发更新返回冲突，不覆盖前一个写入。

### DB-05：Probe、Evidence、Verification、Outcome

交付物：

```text
backend/db/migrations/006_probe_evidence_verification.sql
backend/test/db/outcome-integrity.test.ts
```

必须实现：

- `probe_refs` 只保存外部 Probe 引用，不复制 Probe 定义和执行逻辑。
- `probe_runs` 保存 Operation request ID 和 Probe run ID。
- `evidence` 可关联 Problem、Operation 和可选 Action。
- `verification_runs.target_snapshot` 在启动时冻结。
- `outcomes` 唯一关联一个 Operation 和一个 Verification。

验收用例：没有 `PASSED` Verification 的 Outcome 插入失败。

### DB-06：History、Outbox、索引和 China 种子

交付物：

```text
backend/db/migrations/007_outcome_history_outbox.sql
backend/db/migrations/008_indexes.sql
backend/db/seeds/china_mib3.sql
backend/test/db/migrations.test.ts
backend/test/db/seed.test.ts
```

种子必须包含：China、Production、MIB3 Approval、Probe/Availability 来源、Operation Manager、Backend MIB3、Probe Ops、Product Manager、只读 Management；不得伪造已完成 Outcome。

数据库阶段门禁：

- 从零迁移到最新版本并回退一个版本成功。
- FK、唯一约束、状态字段、乐观锁和 Outcome 完整性测试通过。
- `history_events` 只能追加，`outbox_events` 可重试。
- 查询 Problem、Operation、Evidence 的索引已验证。

## 3. Step 2：API

### API-01：API 基础约定

负责人：Backend API Owner  
依赖：DB-02 ～ DB-06

交付物：

```text
backend/openapi/operation-platform-v1.yaml
backend/openapi/errors.md
backend/openapi/authentication.md
backend/openapi/changelog.md
```

固定约定：

- Base path `/api/v1`。
- JSON 使用 `camelCase`；数据库 UUID 和 UI `displayId` 同时返回。
- 时间统一 ISO 8601 UTC，前端再格式化为 Asia/Shanghai。
- 列表使用 cursor pagination。
- 写接口返回 `version`，更新要求 `If-Match` 或 `expectedVersion`。
- 集成 POST 必须有 `Idempotency-Key`。
- 错误统一返回 `error.code/message/details/traceId`。

### API-02：来源接入契约

交付物：

```text
backend/openapi/examples/probe-result-detection.json
backend/openapi/examples/probe-result-diagnostic.json
backend/openapi/examples/probe-result-verification.json
backend/openapi/examples/availability-event.json
backend/openapi/examples/incident-event.json
backend/openapi/examples/replay-response.json
```

接口：

```text
POST /integrations/probe/results
POST /integrations/availability/events
POST /integrations/incidents/events
POST /integrations/releases/events
GET  /integrations/events/{eventId}
```

完成定义：

- 新事件返回 `202 Accepted`。
- 重复事件返回已有资源引用，不重复创建业务记录。
- 未绑定 Operation 的异常 Probe 结果可以创建 Signal，不要求 Incident。
- 未知 Probe、服务或地区进入 quarantine，不创建误导性 Signal。

### API-03：领域查询和命令

接口清单：

```text
GET  /signals
GET  /signals/{signalId}
POST /signals/{signalId}/investigations
POST /correlations/evaluate
POST /problems/from-signals
GET  /problems
GET  /problems/{problemId}
POST /problems/{problemId}/incidents/{incidentId}
GET  /problems/{problemId}/recommendation
GET  /operations
POST /operations
GET  /operations/{operationId}
POST /operations/{operationId}/start
POST /operations/{operationId}/actions
POST /actions/{actionId}/start
POST /actions/{actionId}/complete
POST /operations/{operationId}/cancel
```

每个 mutation 必须写清：允许的源状态、目标状态、角色、幂等行为、错误码和审计事件。

### API-04：证据闭环和管理视图

接口清单：

```text
POST /operations/{operationId}/probe-runs
GET  /probe-runs/{probeRunId}
GET  /evidence
GET  /evidence/{evidenceId}
POST /operations/{operationId}/verification-runs
POST /verification-runs/{verificationId}/decision
GET  /outcomes
GET  /outcomes/{outcomeId}
GET  /overview/regions/{regionCode}
GET  /command-center?region=CN
```

关键契约：

- `GET /problems/{id}` 一次返回 Impact、Signals、Incidents、Probe、Availability、Operations、Timeline、Recommendation。
- Recommendation 必须返回 `action`、`why`、`supportingEvidence`、`owner`、`expectedOutcome`、可执行 command。
- `POST /verification-runs/{id}/decision` 是唯一可以创建 Outcome 和完成 Operation 的接口。
- PASS 原子更新 Verification、Outcome、Operation、Problem、Signals、History、Outbox。
- FAIL 原子更新 Verification 和状态，不创建 Outcome。

API 阶段门禁：

- OpenAPI lint 零错误。
- 生成的 TypeScript client 可以编译。
- Probe Owner、Frontend、Product 对字段和状态文案签字。
- 至少覆盖异常 Probe、重复回调、Incident 后补、PASS、FAIL、乐观锁冲突示例。

## 4. Step 3：Backend

### BE-01：服务基础

交付物：

```text
backend/src/app.ts
backend/src/config/*
backend/src/auth/*
backend/src/shared/db/*
backend/src/shared/errors/*
backend/src/shared/observability/*
```

完成定义：

- TypeScript strict mode。
- `/health/live` 和 `/health/ready` 可用。
- OIDC 用户鉴权和集成客户端鉴权可区分。
- 日志包含 `traceId`、actor、route、aggregateId、result。
- 服务可以连接空数据库并通过迁移启动。

### BE-02：幂等接入和适配器

交付物：

```text
backend/src/modules/integration/*
backend/src/modules/integration/adapters/probe-adapter.ts
backend/src/modules/integration/adapters/availability-adapter.ts
backend/src/modules/integration/adapters/incident-adapter.ts
backend/test/integration/ingestion.test.ts
```

处理顺序固定为：鉴权 → 校验 → 保存原始事件 → 规范化 → 业务记录 → History/Outbox 同事务提交。

### BE-03：Signal、Correlation、Problem

交付物：

```text
backend/src/modules/signal/*
backend/src/modules/correlation/*
backend/src/modules/problem/*
backend/src/shared/rules/correlation-rules.ts
backend/test/integration/correlation.test.ts
```

V1 只实现可配置的确定性规则：同服务、同地区、同环境、时间窗口重叠、Issue Family 或 Metric 兼容。低于置信度阈值时只返回候选，不自动合并。

Problem Detail 聚合必须支持：

- `unreported`。
- Impact 计算输入。
- Signals、Incidents、Probe Evidence、Availability Evidence。
- Recommended Next Action。
- Active Operations。
- 完整 Timeline。

### BE-04：Operation 和 Action 状态机

交付物：

```text
backend/src/modules/operation/*
backend/src/modules/action/*
backend/src/shared/state-machine/*
backend/test/integration/state-transitions.test.ts
```

状态规则：

```text
Operation: DRAFT → PLANNED → IN_PROGRESS → VERIFYING → COMPLETED
                               ↕ BLOCKED       └─ FAIL 后仍为 VERIFYING
Action:    PLANNED → IN_PROGRESS → COMPLETED
                         ↕ BLOCKED
```

服务端拒绝客户端任意设置 status。完成需要实际结果；需要证明的 Action 还必须有 Evidence 引用。

### BE-05：Evidence、Verification、Outcome

交付物：

```text
backend/src/modules/evidence/*
backend/src/modules/verification/*
backend/src/modules/outcome/*
backend/test/integration/verification.test.ts
backend/test/integration/outcome-transaction.test.ts
```

完成定义：

- 启动 Verification 时冻结 KPI target 和单位。
- 实际值与目标值单位不兼容时拒绝比较。
- FAIL：Verification=`FAILED`、Operation=`VERIFYING`、Problem 不解决、Outcome 数量为 0。
- PASS：只创建一个 Outcome，并在同一事务完成相关对象。
- Delta 和 Business Impact 由服务端根据 Evidence 计算，不能信任 UI 汇总值。

### BE-06：Overview、Command Center、可靠性

交付物：

```text
backend/src/modules/overview/*
backend/src/modules/history/*
backend/src/modules/outbox/*
backend/test/integration/overview-reconciliation.test.ts
backend/test/performance/overview-query.test.ts
docs/runbooks/backup-restore.md
docs/runbooks/outbox-retry.md
```

查询边界：

- Overview：Health、Resolved Problems、Verified Improvement、Business Impact、Completed Operations、Trend、Insights。
- Command Center：Critical/High Risk Problems、Unreported Problems、Active Operations、Pending Verification、需要今天处理的事项。
- 两者都从领域记录实时聚合，不保存独立 Dashboard 总数。

Backend 阶段门禁：

- 全部集成测试脱离浏览器 local state 通过。
- 失败验证和并发更新有自动化断言。
- Overview 数字可与明细查询对账。
- Outbox 重试、死信、Probe callback 延迟都有指标。

## 5. Step 4：Probe 接入

### PRB-01：双方字段和安全确认

负责人：Probe Owner + Backend Engineer + Security  
依赖：API-02、BE-01

交付物：

```text
docs/integrations/probe-contract.md
docs/integrations/probe-field-mapping.csv
docs/integrations/probe-runbook.md
backend/openapi/examples/probe-run-request.json
```

双方必须确认：`clientRequestId`、`runId`、`eventId`、Probe ID、用途、Problem/Operation/Action/Verification context、目标指标、callback URL、鉴权、重试、时钟偏差和 retention。

### PRB-02：Operation → Probe 出站请求

交付物：

```text
backend/src/modules/probe/probe-client.ts
backend/src/modules/probe/probe-auth.ts
backend/test/contract/probe/outbound-request.test.ts
```

Operation 先持久化 `clientRequestId`，再调用 Probe。UI 显示外部 `runId` 和 `resultUrl`，不复制 Probe 分析页面。

### PRB-03：Probe → Operation 回调、重试和对账

交付物：

```text
backend/src/modules/probe/probe-result-adapter.ts
backend/src/modules/probe/probe-reconciliation-job.ts
backend/test/contract/probe/callback.test.ts
backend/test/contract/probe/replay.test.ts
```

分类规则：

- 无上下文且指标异常：Source Event + Signal + Problem Evidence，可形成 Unreported Problem。
- 绑定 Action：Probe Run + Action Evidence。
- 绑定 Verification：Outcome Evidence + `PENDING_REVIEW`，不自动 PASS。
- Probe 技术执行失败不等同于业务 KPI 失败。
- 同一 `eventId` 重放只返回已有引用。
- 未知映射进入 quarantine 并告警。

Probe 阶段门禁：

- Sandbox 返回真实 Probe run ID。
- 成功回调已鉴权并持久化。
- 重放 20 次没有重复 Signal/Evidence。
- UI 能打开独立 Probe result URL。
- 联合 runbook 和联系人已确认。

## 6. Step 5：前端改造

### FE-01：API 和远程状态层

负责人：Frontend Engineer  
依赖：API-03、API-04、BE-01

交付物：

```text
api-client.js
remote-state.js
frontend/config.example.js
frontend/test/unit/api-client.test.js
```

规则：

- 生产模式不加载 `prototype-state.js`，不读写业务 localStorage。
- Server DTO 是唯一业务真相；远程状态层只管理 loading/cache/error/refresh。
- 路由切换取消过期请求，写操作显示服务端返回状态。

### FE-02：按风险顺序迁移读取

交付顺序：

```text
Overview
→ Command Center
→ Signal List/Detail
→ Problem List/Detail
→ Operation List/Detail
→ Evidence / Outcome / History
```

Problem Detail 必须保持以下产品层级：

```text
Problem
→ Impact
→ Signals / Incidents / Probe / Availability
→ Recommended Next Action
→ Active Operations
→ Closed-loop Timeline
```

Recommendation 区块必须展示：下一步、原因、Evidence、Owner、Expected Outcome，并提供 `[Run Probe]`、`[Create Operation]` 等真实命令。

### FE-03：命令迁移

迁移以下写操作：

```text
Investigate Signal
Create/Adopt Problem
Create/Start/Complete Operation
Create/Start/Complete Action
Request Probe
Start Verification
Record PASS/FAIL
```

Command Center 的 Unreported Problem 行必须提供 `[Investigate]`、`[Create Problem]`、`[Create Operation]`，并显示“Probe detected abnormality / No Backend Incident exists”。

### FE-04：刷新、错误和回归

交付物：

```text
frontend/test/e2e/closed-loop.spec.js
frontend/test/e2e/verification-fail.spec.js
frontend/test/e2e/unreported-problem.spec.js
docs/qa/frontend-regression.md
```

必须实现：

- Probe/Verification 详情页可见时每 10 秒刷新。
- Overview/Command Center 每 30 秒刷新，页面隐藏时停止。
- Loading、Empty、Error、Unauthorized、Stale/Retry 状态齐全。
- 保留当前 dark navigation、light content、blue actions、卡片和路由语言。
- 1440px 和 390px 无页面级横向溢出，无内容重叠。

前端阶段门禁：

- 浏览器刷新详情 URL 后仍得到同一个服务端实体。
- 失败 mutation 不显示成功。
- PASS/FAIL E2E 均通过。
- 生产构建中不存在业务 localStorage 读写路径。

## 7. Step 6：第一条真实闭环

### E2E-01：真实异常 Probe → Signal

固定场景：

```text
Service: MIB3 Approval
Region: China
Environment: Production
Journey: Approval Download
failure_rate: 12.8%
availability: 96.1%
target failure_rate: < 1%
target availability: > 99.7%
Initial Incident count: 0
```

执行人：Probe Ops。  
输出：`202`、一个 source event、一个 DETECTED Signal、一个 Probe Evidence。

证据文件：

```text
docs/acceptance/first-real-loop/01-probe-event.json
docs/acceptance/first-real-loop/01-signal-response.json
```

### E2E-02：Signal → Unreported Problem → Operation → Action

执行顺序：

1. 发送 Availability `96.1%`，形成第二个 Signal/Evidence。
2. 执行 Correlation，保存规则解释和匹配分数。
3. 创建或采用 Problem，确认 `unreported=true`、Incident count 为 0。
4. 在 Problem Detail 确认 Recommendation、Evidence、Owner、Expected Outcome。
5. 创建 Operation，填写 Objective、Owner、KPI、Evidence Requirement。
6. 创建诊断 Action，指定 Probe Ops 和 Expected Result。

证据文件：

```text
docs/acceptance/first-real-loop/02-problem-response.json
docs/acceptance/first-real-loop/03-operation-response.json
docs/acceptance/first-real-loop/entity-ids.json
```

### E2E-03：诊断证据和失败验证 rehearsal

执行顺序：

1. 请求诊断 Probe，保存真实 `runId`。
2. 回调诊断结果，确认 Evidence 绑定 Problem、Operation、Action。
3. Backend 完成修复 Action，并附 Release/Action Evidence。
4. 启动 Verification，确认 target snapshot 已冻结。
5. 执行一次失败验证：`failure_rate = 4.8%`、availability `97.4%`。

必须看到：

- Verification=`FAILED`。
- Operation=`VERIFYING`。
- Problem 未解决。
- Outcome 数量仍为 0。
- UI 推荐 Corrective Action。

证据文件：

```text
docs/acceptance/first-real-loop/04-failed-verification.json
docs/acceptance/first-real-loop/05-failed-verification-screenshot.png
```

### E2E-04：Corrective Action → PASS → Outcome

执行顺序：

1. 创建并完成 Corrective Action。
2. 新建 Verification Run，执行最终 Probe：`failure_rate = 0.4%`、availability `99.8%`。
3. 由授权 reviewer 显式记录 PASS。
4. 打开 Outcome Detail 和 China Overview。

必须看到：

- Verification=`PASSED`。
- 一个且仅一个 `VERIFIED Outcome`。
- Operation=`COMPLETED`。
- Problem=`RESOLVED`。
- 相关 Signals=`ARCHIVED`。
- Before/After、Delta、Business Impact、Evidence、Actor、时间和来源引用完整。
- Overview 的 Resolved、Completed、Verified Improvement、Impact、Trend、Insights 更新。

真实闭环证据包：

```text
docs/acceptance/first-real-loop/execution-log.md
docs/acceptance/first-real-loop/api-transcript.json
docs/acceptance/first-real-loop/entity-ids.json
docs/acceptance/first-real-loop/database-checks.sql
docs/acceptance/first-real-loop/screenshots/
docs/acceptance/first-real-loop/probe-result-links.md
docs/acceptance/first-real-loop/known-issues.md
```

闭环阶段门禁：

- 至少 Probe 异常结果来自独立 Probe 环境，不是数据库 seed 或 UI 修改。
- 每个箭头都能由 API response、数据库记录和 UI link 证明。
- FAIL rehearsal 没有提前关闭 Operation。
- PASS 的七类对象更新在一个事务内完成。
- 没有人工修改 status。

## 8. Step 7：最终验收标准

### ACC-01：产品验收

Product Manager 和 Management 仅通过 Overview/Command Center 就能回答：

1. China 当前是否健康？
2. 今天有哪些 Critical/High Risk、Unreported Problem、Pending Verification？
3. 哪些 Problem 已解决？
4. 哪个 Operation 由谁执行？
5. 哪些 Evidence 证明结果？
6. failure rate、availability、users affected 或 downtime 是否改善？

### ACC-02：功能验收

- Probe、Availability、Incident 保持独立来源。
- Signal ingestion 幂等。
- Correlation 返回匹配 Signal、规则和分数。
- Problem 无 Incident 也可创建。
- Recommendation 包含行动、原因、证据、Owner、Expected Outcome。
- Problem Detail 显示 Active Operations、Actions 和闭环 Timeline。
- Evidence 可追溯到 source 和关联对象。
- PASS/FAIL Verification 行为严格符合状态机。
- Outcome 包含 before、after、delta、impact、conclusion、Evidence。
- Overview 与 Command Center 不再是 Incident count dashboard。

### ACC-03：数据、安全和可靠性验收

- 无孤儿 Signal、Evidence、Verification、Outcome、Action、Operation。
- 一个 Probe event 最多一个 source event 和上下文相关业务结果。
- History append-only 且顺序正确。
- 乐观锁阻止静默覆盖。
- 用户和集成客户端均强制鉴权，角色权限经过测试。
- 敏感字段不进入日志；凭据不在仓库。
- 初始性能目标：接入确认 p95 < 500ms、Signal 可见 p95 < 30s、Detail p95 < 500ms、Overview p95 < 2s。
- RPO ≤ 15 分钟，RTO ≤ 4 小时。

### ACC-04：UX 和运行准备验收

- 桌面 1440px、移动 390px 无横向溢出和重叠。
- Loading、Empty、Error、Unauthorized、Stale、Retry 状态可操作。
- Deployment、Rollback、Migration、Backup/Restore、Probe reconciliation、故障响应手册齐全。
- 有接入失败、callback 延迟、数据库、API 错误、Outbox backlog 监控和告警。
- Product、Operation、Backend、Frontend、Probe、QA、Security 完成签字。

发布阻断条件：

- Problem 仍要求先有 Incident。
- Probe 执行逻辑被复制进 Operation Platform。
- Action 完成可以直接关闭 Operation。
- FAIL Verification 创建 Outcome 或解决 Problem。
- 生产前端仍依赖 `prototype-state.js` 或业务 localStorage。
- 已接受的集成事件可能丢失或重复。

## 9. 可直接建立的任务单

以下 ID 可以直接复制到 Jira/Linear；每个任务的描述引用本文同名交付包：

```text
DB-01  Database migration skeleton
DB-02  Source events and Signals schema
DB-03  Problem and Incident relationship schema
DB-04  Operation and Action schema
DB-05  Evidence Verification Outcome schema
DB-06  Audit outbox indexes and China seed
API-01 API conventions auth and errors
API-02 Integration contracts
API-03 Domain query and command contracts
API-04 Verification Outcome Overview contracts
BE-01  Backend foundation
BE-02  Idempotent ingestion adapters
BE-03  Signal correlation Problem service
BE-04  Operation Action state machine
BE-05  Evidence Verification Outcome transaction
BE-06  Overview Command Center and observability
PRB-01 Probe contract and security sign-off
PRB-02 Operation to Probe client
PRB-03 Probe callback retry and reconciliation
FE-01  API client and remote state
FE-02  Read page migration
FE-03  Command migration
FE-04  Refresh errors accessibility and E2E
E2E-01 Real abnormal Probe to Signal
E2E-02 Unreported Problem to Operation
E2E-03 Failed Verification rehearsal
E2E-04 Corrective Action to PASS Outcome
ACC-01 Final product and technical acceptance
```

## 10. 交付完成判断

当且仅当以下条件全部成立时，V1.2 真实闭环交付完成：

```text
数据库可迁移
+ API 已冻结
+ Backend 不依赖浏览器状态
+ Probe 回调幂等且可对账
+ 前端生产模式只读写 API
+ China 场景 PASS/FAIL 均有证据
+ Outcome、Overview、History 可追溯
+ 全部验收角色签字
```

详细字段、状态和 API 解释继续以 [Operation_Platform_Real_Closed_Loop_Delivery_Plan.md](./Operation_Platform_Real_Closed_Loop_Delivery_Plan.md) 为准；本文只负责把它拆成可以直接交付和验收的工作包。
