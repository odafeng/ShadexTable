"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import LightButton from "@/components/LightButton";

export default function TermsPage() {
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
          使用者條款
        </motion.h1>

        <div className="space-y-10 text-[17px] leading-[32px] tracking-[1.5px] text-[#586D81]"
          style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
        >
          <p>
            歡迎使用 Shadex（以下簡稱「本服務」），由 DatoVivo 團隊開發與營運。
            使用本服務即表示您已閱讀、理解並同意遵守本使用者條款。
            若您不同意以下任何條款，請勿使用本服務。
          </p>

          {[
            { title: "一、服務內容", content: "本服務提供以人工智慧輔助的統計分析平台，協助使用者執行資料檢定、表格產製、摘要撰寫與視覺化分析。本服務專為臨床研究與醫學領域所設計，旨在提升研究效率與分析品質。" },
            { title: "二、帳號與註冊", content: "使用本服務需透過電子郵件進行註冊與登入。使用者有責任維護帳號與密碼之安全，並對透過其帳號進行的所有活動負責。若發現未經授權之使用，請立即聯繫我們。" },
            { title: "三、智慧財產權", content: "本服務相關之軟體、設計、演算法、UI 元件、圖示與文字內容，均為 DatoVivo 或其授權人所有。未經書面許可，任何人不得重製、散布、修改、翻譯或進行反向工程等行為。" },
            { title: "四、使用限制", content: (
              <div>
                使用者不得從事下列行為：
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>干擾服務運作或試圖未經授權存取資料</li>
                  <li>使用服務進行非法、欺詐、侵權或違反公共秩序之行為</li>
                  <li>散布惡意程式碼、病毒，或進行自動化存取行為（如 bots、爬蟲等）</li>
                </ul>
              </div>
            )},
            { title: "五、點數與付費", content: "本服務部分功能需透過點數使用，使用者可透過購買或活動獲得點數。點數一經使用恕不退還，亦不得兌換現金或轉讓他人。點數屬於虛擬商品，本公司保留隨時調整計費方式與結構之權利。" },
            { title: "六、服務中斷與變更", content: "本公司有權因維護、升級、法令要求或不可抗力等因素，暫停或終止部分或全部服務。如有重大異動，將透過網站公告或電子郵件通知。" },
            { title: "七、免責聲明", content: "本服務僅提供統計工具與技術協助，所產出之分析結果僅供研究參考，不保證其正確性與適用性，亦不構成醫療建議。使用者應自行判斷結果適用性並承擔相關風險。" },
            { title: "八、準據法與管轄法院", content: (
              <>
                本條款之解釋與適用，均依據中華民國法律。
                雙方若發生爭議，應以
                <span className="font-semibold text-[#0F2844]"> 臺灣高雄地方法院 </span>
                為第一審管轄法院。
              </>
            )},
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
          <LightButton text="回首頁" href="/" />
        </div>
      </div>
    </main>
  );
}
