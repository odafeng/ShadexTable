"use client";

import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 xl:px-24 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
            不會程式？沒學過統計？<br className="hidden md:block" />
        </h1>
        <h2 className="text-2xl md:text-3xl mt-4 font-bold leading-tight tracking-tight text-gray dark:text-white">
            3 秒自動產表，寫 paper 也能超前部署。
        </h2>
        
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          ShadyTable 專為臨床研究者打造，<br></br>自動選擇統計檢定、自動產表、自動產出學術摘要段落。
        </p>
        <div className="mt-8">
          <Link href="/step1">
            <Button className="text-base px-6 py-2 bg-primary text-white hover:bg-primary/90 transition font-semibold rounded-xl shadow">
              立即開始分析
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 xl:px-24 space-y-32 pb-28">
        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 items-center gap-14">
          <div>
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow border">
                <iframe
                    src="https://www.youtube.com/embed/j6LA8vOReVk?autoplay=1&mute=1&loop=1&playlist=j6LA8vOReVk&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1"
                    title="點選變項示範影片"
                    allow="autoplay"
                    allowFullScreen
                    className="w-full h-full pointer-events-none"
                  />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-600 w-5 h-5" /> 點選變項，自動選擇檢定
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              不需任何程式經驗，只要上傳資料、選擇變項，ShadyTable 會根據型別與分組自動判斷統計方法，免除你操作 SPSS 的痛苦。
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 items-center gap-14 md:flex-row-reverse">
          <div>
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow border">
             <iframe
                src="https://www.youtube.com/embed/XeRpEdOuJbE?autoplay=1&mute=1&loop=1&playlist=XeRpEdOuJbE&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1"
                title="AI 摘要示範影片"
                allow="autoplay"
                allowFullScreen
                className="w-full h-full pointer-events-none"
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-600 w-5 h-5" /> GPT-4o 自動產出結果段落
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              整合 OpenAI GPT-4o 模型，根據統計結果自動撰寫學術風格摘要，免去手動編寫數據敘述的麻煩，輕鬆貼進論文或報告中。
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid md:grid-cols-2 items-center gap-14">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-600 w-5 h-5" /> 直覺式介面，零學習曲線
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              所有步驟都以臨床思維設計，沒有繁雜選單與設定。拖拉點選 → 即時分析 → 視覺化結果，一氣呵成。
            </p>
          </div>
          <div>
            <Image
              src="/features/ui-simple.png"
              alt="簡潔介面"
              width={700}
              height={400}
              className="rounded-2xl border shadow"
            />
          </div>
        </div>

        {/* Feature 4 */}
        <div className="grid md:grid-cols-2 items-center gap-14 md:flex-row-reverse">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-600 w-5 h-5" /> 真的不需要寫程式，也不用學 SPSS
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              你可以完全不用碰程式，也不用思考「該用哪個檢定方法」。ShadyTable 幫你選、幫你跑、幫你寫，讓統計變得像使用 Google 一樣直覺。
            </p>
          </div>
          <div>
            <Image
              src="/features/spss-vs-shady.png"
              alt="SPSS 對比圖"
              width={700}
              height={400}
              className="rounded-2xl border shadow"
            />
          </div>
        </div>
      </section>

      {/* CTA Again */}
      <section className="text-center py-12 border-t">
        <h3 className="text-2xl font-bold">準備好了嗎？</h3>
        <p className="mt-2 text-muted-foreground">立即試用 ShadyTable，開始你的智慧統計之旅。</p>
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link href="/step1">
                <Button className="text-base px-6 py-2 bg-primary text-white hover:bg-primary/90 transition font-semibold rounded-xl shadow">
                  開始分析      
                </Button>
            </Link>
          <Link href="/">
            <Button variant="outline" className="text-base px-6 py-2 font-semibold rounded-xl">
              回首頁
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
