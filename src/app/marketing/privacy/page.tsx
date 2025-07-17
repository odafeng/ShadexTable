"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-[#0F2844] py-16">
      <div className="container-custom max-w-3xl space-y-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[38px] leading-[56px] tracking-[3px] font-bold"
          style={{
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
          }}
        >
          隱私權政策
        </motion.h1>

        <div className="space-y-10 text-[17px] leading-[32px] tracking-[1.5px] text-[#586D81]"
          style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
        >
          <p>
            本政策說明 ShadyTable（以下簡稱「本服務」）如何蒐集、使用、保護與分享使用者之個人資料與上傳資料。
            若您不同意本政策內容，請停止使用本服務。
          </p>

          {[
            {
              title: "一、資料蒐集方式",
              content: (
                <>
                  我們所蒐集之資訊僅限於：
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>註冊帳號所需之 Email 資訊</li>
                    <li>登入與點數使用記錄</li>
                    <li>用於功能操作之資料結構（不含具識別性內容）</li>
                  </ul>
                </>
              ),
            },
            {
              title: "二、資料處理與保護",
              content: (
                <>
                  所有使用者上傳之資料皆於瀏覽器端進行分析，
                  <strong className="text-[#0F2844]">不會儲存於伺服器</strong>。
                  本服務採用 HTTPS 傳輸與最小資料原則，並避免任何個資上傳伺服器。
                </>
              ),
            },
            {
              title: "三、Cookie 與追蹤技術",
              content:
                "為提供個人化體驗，本服務使用 Cookie 儲存偏好設定（如暗色模式、登入狀態）。我們不使用 Google Analytics 或任何第三方追蹤器。",
            },
            {
              title: "四、第三方服務",
              content: (
                <>
                  本服務使用 Clerk 提供登入驗證功能，其隱私政策請參考{" "}
                  <a
                    href="https://clerk.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#008587]"
                  >
                    https://clerk.com/privacy
                  </a>
                </>
              ),
            },
            {
              title: "五、使用者權利",
              content: (
                <>
                  使用者可隨時要求我們刪除其帳號與相關資料，並有權查詢其帳號所儲存之資訊。
                  若您希望刪除帳號，請來信{" "}
                  <a
                    href="mailto:support@shadytable.com"
                    className="underline text-[#008587]"
                  >
                    support@shadytable.com
                  </a>
                  。
                </>
              ),
            },
            {
              title: "六、政策修訂",
              content:
                "本公司保留隨時更新本政策之權利。如有重大變動，將透過網站公告或電子郵件通知您。最新版本將始終公布於本網站上。",
            },
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1), duration: 0.4 }}
              className="space-y-3"
            >
              <h2 className="text-[20px] text-[#0F2844] font-semibold leading-[38px] tracking-[2px]">
                {section.title}
              </h2>
              <div>{section.content}</div>
            </motion.div>
          ))}
        </div>

        <div className="pt-8">
          <Link href="/">
            <Button variant="outline" className="rounded-full px-6 text-base tracking-[2px]">
              回首頁
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
