# API Surface（可自動產生 + 手動補充）

> 目標：讓任何人快速了解前後端可用的 API 與路由。

## 1) 前端路由（Next.js App Router）
> 建議執行以下指令自動蒐集，並覆蓋此區塊：
```bash
# 於前端根目錄
grep -R "export default function" -n app/ | sed 's/^/- /'
```

- /step1
- /step2
- /step3
- /dashboard
- /marketing/features
- /sign-in
- /sign-up

## 2) 後端路由（FastAPI）
> 建議執行以下指令自動蒐集，並覆蓋此區塊：
```bash
# 於後端根目錄
grep -R "@app\.(get\|post\|put\|delete)" -n app/ | sed 's/^/- /'
```
- POST /api/table/summary/ai
- POST /api/regression/logistic/run
- POST /api/regression/linear/run
- POST /api/survival/km
- POST /api/survival/cox

## 3) 回應規格（StandardResponse）
- `success: bool`
- `message: str | None`
- `data: Any | None`
- `error: { code: str, details?: Any } | None`
- `correlation_id: str`

> 請在 PR 中同步維護此檔案。若自動產生內容有誤，請以實作為準修正。
