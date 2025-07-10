"use client";

import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-4">
      <Container className="max-w-3xl space-y-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold"
        >
          使用者條款
        </motion.h1>

        <Separator />

        <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            歡迎使用 ShadyTable（以下簡稱「本服務」），由 AI Medicus 團隊開發與營運。
            使用本服務即表示您已閱讀、理解並同意遵守本使用者條款。
            若您不同意以下任何條款，請勿使用本服務。
          </p>

          <h2 className="text-xl font-semibold text-foreground">一、服務內容</h2>
          <p>
            本服務提供以人工智慧輔助的統計分析平台，協助使用者執行資料檢定、表格產製、摘要撰寫與視覺化分析。
            本服務專為臨床研究與醫學領域所設計，旨在提升研究效率與分析品質。
          </p>

          <h2 className="text-xl font-semibold text-foreground">二、帳號與註冊</h2>
          <p>
            使用本服務需透過電子郵件進行註冊與登入。
            使用者有責任維護帳號與密碼之安全，並對透過其帳號進行的所有活動負責。
            若發現未經授權之使用，請立即聯繫我們。
          </p>

          <h2 className="text-xl font-semibold text-foreground">三、智慧財產權</h2>
          <p>
            本服務相關之軟體、設計、演算法、UI 元件、圖示與文字內容，均為 AI Medicus 或其授權人所有。
            未經書面許可，任何人不得重製、散布、修改、翻譯或進行反向工程等行為。
          </p>

          <h2 className="text-xl font-semibold text-foreground">四、使用限制</h2>
          <p>使用者不得從事下列行為：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>干擾服務運作或試圖未經授權存取資料</li>
            <li>使用服務進行非法、欺詐、侵權或違反公共秩序之行為</li>
            <li>散布惡意程式碼、病毒，或進行自動化存取行為（如 bots、爬蟲等）</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">五、點數與付費</h2>
          <p>
            本服務部分功能需透過點數使用，使用者可透過購買或活動獲得點數。
            點數一經使用恕不退還，亦不得兌換現金或轉讓他人。點數屬於虛擬商品，本公司保留隨時調整計費方式與結構之權利。
          </p>

          <h2 className="text-xl font-semibold text-foreground">六、服務中斷與變更</h2>
          <p>
            本公司有權因維護、升級、法令要求或不可抗力等因素，暫停或終止部分或全部服務。
            如有重大異動，將透過網站公告或電子郵件通知。
          </p>

          <h2 className="text-xl font-semibold text-foreground">七、免責聲明</h2>
          <p>
            本服務僅提供統計工具與技術協助，所產出之分析結果僅供研究參考，
            不保證其正確性與適用性，亦不構成醫療建議。
            使用者應自行判斷結果適用性並承擔相關風險。
          </p>

          <h2 className="text-xl font-semibold text-foreground">八、準據法與管轄法院</h2>
          <p>
            本條款之解釋與適用，均依據中華民國法律。
            雙方若發生爭議，應以<span className="font-semibold">臺灣高雄地方法院</span>為第一審管轄法院。
          </p>
        </div>

        <div className="pt-10">
          <Link href="/">
            <Button variant="outline">回首頁</Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
