# Operation Platform 数据分类与脱敏规范

## 目标

真实数据进入平台前必须完成分类、鉴权、校验和脱敏。普通业务查询只接触标准化的运营事实；原始来源数据不以明文进入 PostgreSQL、日志、前端、导出文件或 AI 请求。

## 数据分级

| 等级 | 例子 | 处理方式 | 可见范围 |
| --- | --- | --- | --- |
| L0 运营摘要 | service、region、metric、severity、status | 可查询、可进入 Overview | Management 及授权角色 |
| L1 运营证据 | Probe result、Availability、Release reference、Incident ID | 标准化保存，保留 source reference | Operation、Backend、Probe、Product |
| L2 可关联身份 | email、phone、VIN、device ID、customer ID | HMAC-SHA256 伪名化；原值不进入业务表 | 仅受控排障流程 |
| L3 秘密和凭据 | Authorization、Cookie、Password、Token、API Key、Webhook Secret | 阻断/替换为 `[REDACTED]`；不得落日志 | Secret Manager 或来源系统 |
| L4 原始 Payload | 完整请求体、客户投诉原文、原始响应 | 默认不保存；确需保存时应用层加密并只存 ciphertext + key reference | 极少数受审计的 Security/Backend |

## 四层保护

```text
Ingestion allow-list and schema validation
        ↓
Recursive redaction and HMAC pseudonymization
        ↓
Encrypted raw payload quarantine (optional)
        ↓
Role-scoped API DTO and AI-safe projection
```

## 规则

1. 生产前端不接收生产密钥，不直接读取原始 Payload。
2. `source_events.payload` 只能保存脱敏后的标准化/可查询内容；原始内容如有必要，保存为应用层加密密文。
3. 普通日志采用 allow-list；未知字段不记录。
4. 邮箱、手机号、VIN、设备号和客户号使用 HMAC 伪名化，密钥由 Secret Manager 管理并支持轮换。
5. Token、Cookie、Password、API Key、Private Key 和 Webhook Signature 永远不进入日志、前端或 AI projection。
6. AI 只接收 `AI_SAFE_OPERATIONAL_SUMMARY`，不能接收 `rawPayload`、L2 身份原值或 L3 秘密。
7. 导出 PDF、Excel、截图和 API transcript 在导出前再次执行 redaction。
8. 原始数据访问单独记录审计事件，不能与普通 domain history 混用。

## 接入验收

- 真实事件中明文 Token、Password、Cookie、Email、Phone、VIN 均为 0。
- 同一外部 ID 在脱敏后仍可稳定幂等和关联。
- 普通 API 响应不包含原始 Payload。
- 浏览器源码和 Network 中没有生产密钥。
- AI request 只能由 AI-safe projection builder 生成。
- 日志、截图、导出文件通过敏感字段扫描。
- 原始密文访问有 actor、purpose、traceId 和 timestamp 审计。
