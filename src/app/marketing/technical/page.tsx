
"use client";

import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LightButton from "@/components/LightButton";


export default function TechnicalPage() {
  return (
    <main className="min-h-screen bg-white text-[#0F2844] py-16">
      <div className="container-custom max-w-5xl space-y-12">
        <div className="flex justify-between items-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[38px] font-bold tracking-[3px] leading-[56px]"
            style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
          >
            統計方法技術文件
          </motion.h1>

          <LightButton text="回首頁" href="/" />
        </div>

        <p className="text-[17px] text-[#586D81] tracking-[1px] leading-[30px] text-left">
          本頁面提供 ShadyTable 所採用之統計邏輯、中英文對照說明與引用建議。
        </p>

        <Tabs defaultValue="zh" className="w-full">
          <TabsList className="w-full flex justify-center rounded-xl bg-[#F2F4F7] border shadow-sm">
            <TabsTrigger value="zh" className="w-1/2 py-3 text-base font-medium">中文說明</TabsTrigger>
            <TabsTrigger value="en" className="w-1/2 py-3 text-base font-medium">English Version</TabsTrigger>
          </TabsList>

          <TabsContent value="zh">
            <div className="mt-8 bg-white rounded-xl border p-8 shadow-sm text-[17px] leading-[32px] tracking-[1.5px] text-[#586D81] space-y-8"
              style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              <section>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">統計邏輯設計原則</h2>
                <p>ShadyTable 以 Python 為核心，根據統計教科書與期刊慣例，設計標準化且可重複的統計檢定流程。</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">支援的統計方法</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>常態性檢定 [1–8]：<span className="text-[#008587] font-semibold">Shapiro-Wilk test</span> </li>
                  <p>
                    在比較連續變項之前進行常態性檢定，是許多統計分析流程中的關鍵步驟。多數統計方法皆假設資料呈現常態分布，若忽略此假設，可能會導致誤用統計工具或錯誤推論。
                  </p>
                  <p>
                    目前建議採用 Shapiro-Wilk 或 Chen-Shapiro 檢定，這兩種方法的整體表現通常優於傳統的 Kolmogorov-Smirnov 檢定。然而，這些方法在樣本數低於 50 時檢定力（power）較低，因此在詮釋結果時需格外謹慎。理解資料分布特性，有助於正確選擇統計方法與摘要指標。
                  </p>
                  <p className="text-[#D97706] italic text-[15px] leading-relaxed">
                    <strong>ShadyTable 系統邏輯：</strong>當使用者將變項指定為連續型後，<span className="font-semibold">系統會自動執行 Shapiro-Wilk 檢定</span>，並顯示檢定統計量與 p 值。若資料不符合常態分布，系統將自動套用非參數檢定；若符合常態分布，則使用參數檢定。對於樣本數過少（如少於 50）者，請謹慎解讀檢定結果。
                  </p>

                  <li>類別變項 vs 類別變項 [9–14]：<span className="text-[#008587] font-semibold">卡方檢定、Fisher’s exact test</span></li>
                  <p>
                    皮爾森卡方檢定雖常用於列聯表分析，但其結果僅能部分反映變項間的關聯性，尤其當變項類別眾多時，結果常難以解釋。此外，卡方檢定亦容易被誤用，導致過度詮釋，在變項選擇時也可能產生誤導。
                  </p>
                  <p>
                    此外，卡方統計量缺乏尺度不變性（scale invariance），意即在不同單位下可能產生不同結果；而常與其搭配使用的效應量（如 Cramer's V）亦常低估實際關聯強度。
                  </p>
                  <p>
                    為克服上述限制，研究者已提出多種替代方法，如 G 檢定、多變項邏輯回歸等。使用卡方檢定時應保持謹慎，必要時輔以其他方法。
                  </p>
                  <p className="text-[#D97706] italic text-[15px] leading-relaxed">
                    <strong>ShadyTable 系統邏輯：</strong>對於 2 × 2 列聯表，若總樣本數小於 20 或任一格的期望值小於 5，<span className="font-semibold">系統將自動改用 Fisher’s exact test</span>。若為更大列聯表且樣本數較小，則會顯示警語，提醒使用者對結果謹慎詮釋。
                  </p>

                  <li>類別變項 vs 連續變項 [15–20]：<span className="text-[#008587] font-semibold">t-test、Mann–Whitney U、ANOVA、Kruskal–Wallis</span></li>
                  <p>
                    t 檢定與 ANOVA 適用於資料符合常態分布的情境，屬於參數檢定；而 Mann-Whitney U 與 Kruskal-Wallis 則為非參數檢定，適用於非常態或序位資料。
                  </p>
                  <p>
                    Mann-Whitney U 用於兩組比較，Kruskal-Wallis 可處理三組以上的情形，且兩者皆根據中位數進行比較，不假設資料分布形態。
                  </p>
                  <p>
                    雖然非參數檢定在統計檢定力上通常不如參數方法，但當資料違反常態分布或變異數齊性假設時，非參數方法提供了更穩健的選擇。
                  </p>
                  <p className="text-[#D97706] italic text-[15px] leading-relaxed">
                    <strong>ShadyTable 系統邏輯：</strong>
                    系統會根據常態性檢定的結果，自動選擇適合的檢定方法，無需使用者手動切換。
                  </p>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">資料處理與隱私</h2>
                <p>所有資料僅於瀏覽器本地端處理，平台<strong>不儲存、不上傳</strong>任何使用者上傳檔案。</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">引用建議</h2>
                <p>
                  ShadyTable 之統計核心引擎乃基於<strong>Python 3.13.5</strong> 建構，所有統計數據計算皆於該版本環境中執行。
                  撰寫學術論文時，建議於「統計方法」一節揭露此資訊，以提升分析過程之透明度與重現性。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">參考文獻</h2>
                <div className="italic text-xs text-gray-600 space-y-2">
                  {/* 你可以把已整理好的 Vancouver 格式文獻貼在這裡 */}
                  <p>1. Sainani KL. Dealing with non-normal data. PM R. 2012;4(12):1001–1005. doi:10.1016/j.pmrj.2012.10.013</p>
                  <p>2. Ludbrook J. Issues in biomedical statistics: comparing means under normal distribution theory. Aust N Z J Surg. 1995;65(4):267–272. doi:10.1111/j.1445-2197.1995.tb00626.x</p>
                  <p>3. Lamb CR. Statistical briefing: which test? Vet Radiol Ultrasound. 2009;50(4):447. doi:10.1111/j.1740-8261.2009.01565.x</p>
                  <p>4. Bellolio MF, et al. Alternatives for testing data normality. Ann Emerg Med. 2008;52(2):121–127.</p>
                  <p>5. Ruxton GD, Colegrave N. Testing for normality: a comparison of tests. Anim Behav. 2015;102:1–7.</p>
                  <p>6. Razali NM, Yap BW. Power comparisons of Shapiro-Wilk, Kolmogorov-Smirnov, Lilliefors and Anderson-Darling tests. J Stat Model Anal. 2011;2(1):21–33.</p>
                  <p>7. Ruxton GD, Wilkinson DM, Neuhäuser M. Advice on testing the null hypothesis that a sample is drawn from a normal distribution. Anim Behav. 2015;107:249–252. doi:10.1016/j.anbehav.2015.07.006</p>
                  <p>8. Hancock AA, Bush EN, Stanisic D, Kyncl JJ, Lin CT. Data normalization before statistical analysis: keeping the horse before the cart. Trends Pharmacol Sci. 1988;9(1):29–32. doi:10.1016/0165-6147(88)90239-8</p>
                  <p>9. Kangave D. More enlightenment on the essence of applying Fisher's exact test when testing for statistical significance using small sample data presented in a 2 × 2 table. West Afr J Med. 1992;11(3):179–184.</p>
                  <p>10. Pedersen T. Fishing for exactness. arXiv preprint cmp-lg/9608010. 1996.</p>
                  <p>11. Lydersen S, Fagerland MW, Laake P. Recommended tests for association in 2 × 2 tables. Stat Med. 2009;28(7):1159–1175. doi:10.1002/sim.3531</p>
                  <p>12. Warner P. Testing association with Fisher's exact test. J Fam Plann Reprod Health Care. 2013;39(4):281–284.</p>
                  <p>13. Lyman S, Kirkley S, Ashikaga T, Anderson DD, Guanche CA, Sandmeier R. Letters to the editor. Am J Sports Med. 2000;28(6):918–921. doi:10.1177/03635465000280062701</p>
                  <p>14. Hazra A, Gogtay N. Biostatistics series module 4: comparing groups – categorical variables. Indian J Dermatol. 2016;61(4):385–392. doi:10.4103/0019-5154.185700</p>
                  <p>15. Dexter F, Chestnut DH. Analysis of statistical tests to compare visual analog scale measurements among groups. Anesthesiology. 1995;82(4):896–902. doi:10.1097/00000542-199504000-00012</p>
                  <p>16. McKnight PE, Najab J. Mann-Whitney U Test. In: Weiner IB, Craighead WE, editors. The Corsini Encyclopedia of Psychology. Hoboken: Wiley; 2010. doi:10.1002/9780470479216.corpsy0524</p>
                  <p>17. Rivas-Ruíz R, Moreno-Palacios J, Talavera JO. [Clinical research XVI. Differences between medians with the Mann-Whitney U test]. Rev Med Inst Mex Seguro Soc. 2013;51(4):414–419.</p>
                  <p>18. Ostertagová E, Ostertag O, Kováč J. Methodology and application of the Kruskal-Wallis test. Appl Mech Mater. 2014;611:115–120. doi:10.4028/www.scientific.net/AMM.611.115</p>
                  <p>19. Emerson RW. Parametric tests, their nonparametric alternatives, and degrees of freedom. J Vis Impair Blind. 2016;110(5):377–380. doi:10.1177/0145482X1611000511</p>
                  <p>20. Kitchen CMR. Nonparametric vs parametric tests of location in biomedical research. Am J Ophthalmol. 2009;147(4):571–572.</p>
                </div>
              </section>
            </div>
          </TabsContent>


          {/* 英文內容 */}

          <TabsContent value="en">
            <div className="mt-8 bg-white rounded-xl border p-8 shadow-sm text-[17px] leading-[32px] tracking-[1.5px] text-[#586D81] space-y-8"
              style={{ fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif' }}
            >
              <div>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">Statistical Logic and Assumptions</h2>
                <p>
                  ShadyTable is powered by Python and follows best practices from statistical textbooks and peer-reviewed publications, aiming to provide a standardized and reproducible workflow.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#0F2844] mb-2">Supported Statistical Methods</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Normality Test [1–8]: <span className="text-[#008587] font-semibold">Shapiro-Wilk test </span></li>
                  <p>
                    Performing a normality test before comparing continuous variables is a critical step, as many statistical methods assume a normal distribution of data. Ignoring this assumption may lead to the misapplication of statistical tools and incorrect conclusions.
                  </p>
                  <p>
                    The Shapiro-Wilk and Chen-Shapiro tests are currently recommended due to their superior performance over the traditional Kolmogorov-Smirnov test. However, when the sample size is less than 50, the statistical power of these tests is low, and results should be interpreted with caution.
                  </p>
                  <p>
                    Understanding the distribution of data is essential for selecting the appropriate statistical method and summary measure.
                  </p>
                  <p className="text-[#D97706] italic text-[15px] leading-relaxed">
                    <strong>ShadyTable System Logic:</strong> Once a variable is designated as continuous, <span className="font-semibold">the system automatically performs the Shapiro-Wilk test</span> and displays the test statistic and p-value. If the data is not normally distributed, non-parametric tests will be used; otherwise, parametric tests will be applied. Note that for small sample sizes (e.g., &lt; 50), results should be interpreted with extra caution.
                  </p>

                  <li>Category vs Category [9–14]: <span className="text-[#008587] font-semibold">Chi-square test, Fisher’s exact test</span></li>
                  <p>
                    Pearson’s Chi-square test is widely used for analyzing contingency tables, but it has several limitations. It only partially reflects the association between categorical variables, especially when many levels are present, and interpretation can be difficult. It is also prone to misapplication and overinterpretation, potentially leading to unsupported conclusions.
                  </p>
                  <p>
                    Moreover, the Chi-square statistic lacks scale invariance—results may differ depending on the units used. Cramer’s V, commonly used as an effect size for Chi-square, often underestimates the true strength of association.
                  </p>
                  <p>
                    To address these issues, researchers have proposed alternative methods such as the G-test and multinomial logistic regression. Chi-square should be applied and interpreted with caution and, where appropriate, supplemented by additional techniques.
                  </p>
                  <p className="text-[#D97706] italic text-[15px] leading-relaxed">
                    <strong>ShadyTable System Logic:</strong> For 2 × 2 tables, if the total sample size is less than 20 or any expected cell count is less than 5, <span className="font-semibold">Fisher’s exact test will be applied automatically.</span> For larger tables with small sample sizes, the system will display a warning. Advanced methods like the G-test and permutation tests are not yet available on this platform.
                  </p>

                  <li>Category vs Continuous [15–20]: <span className="text-[#008587] font-semibold">t-test, Mann–Whitney U, ANOVA, Kruskal–Wallis</span></li>
                  <p>
                    The t-test and ANOVA are parametric methods used for comparing means between groups when data follows a normal distribution. When this assumption is violated, non-parametric alternatives such as the Mann–Whitney U and Kruskal–Wallis tests are more appropriate.
                  </p>
                  <p>
                    The Mann–Whitney U test is used for comparing two groups, while the Kruskal–Wallis test handles three or more groups. These tests rely on medians rather than means and do not require assumptions about the data’s distribution.
                  </p>
                  <p>
                    Although non-parametric tests generally have lower statistical power compared to their parametric counterparts, they are more robust and suitable when data conditions do not meet parametric assumptions.
                  </p>
                  <p className="text-[#D97706] italic text-[15px] leading-relaxed">
                    <strong>ShadyTable System Logic:</strong> Based on the result of the normality test, ShadyTable will automatically select either a parametric or non-parametric test—no manual switching is required.
                  </p>
                </ul>
              </div>
            

            <div>
              <h2 className="text-xl font-semibold text-[#0F2844] mb-2">Data Processing and Privacy</h2>
              <p>
                All uploaded files are processed locally in your browser. ShadyTable does <strong>not store or upload</strong> any data. Please ensure that all personally identifiable information is removed prior to use.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#0F2844] mb-2">Suggested Citation</h2>
              <p>
                The statistical engine of ShadyTable is built on <strong>Python 3.13.5</strong>, and all statistical computations are performed within this environment. When preparing academic manuscripts, it is recommended to disclose this information in the 'Statistical Methods' section to enhance the transparency and reproducibility of the analysis.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#0F2844] mb-2">References</h2>
              <div className="italic text-xs text-gray-600 space-y-4">
                {/* 你可以把已整理好的 Vancouver 格式文獻貼在這裡 */}
                <p>1. Sainani KL. Dealing with non-normal data. PM R. 2012;4(12):1001–1005. doi:10.1016/j.pmrj.2012.10.013</p>
                <p>2. Ludbrook J. Issues in biomedical statistics: comparing means under normal distribution theory. Aust N Z J Surg. 1995;65(4):267–272. doi:10.1111/j.1445-2197.1995.tb00626.x</p>
                <p>3. Lamb CR. Statistical briefing: which test? Vet Radiol Ultrasound. 2009;50(4):447. doi:10.1111/j.1740-8261.2009.01565.x</p>
                <p>4. Bellolio MF, et al. Alternatives for testing data normality. Ann Emerg Med. 2008;52(2):121–127.</p>
                <p>5. Ruxton GD, Colegrave N. Testing for normality: a comparison of tests. Anim Behav. 2015;102:1–7.</p>
                <p>6. Razali NM, Yap BW. Power comparisons of Shapiro-Wilk, Kolmogorov-Smirnov, Lilliefors and Anderson-Darling tests. J Stat Model Anal. 2011;2(1):21–33.</p>
                <p>7. Ruxton GD, Wilkinson DM, Neuhäuser M. Advice on testing the null hypothesis that a sample is drawn from a normal distribution. Anim Behav. 2015;107:249–252. doi:10.1016/j.anbehav.2015.07.006</p>
                <p>8. Hancock AA, Bush EN, Stanisic D, Kyncl JJ, Lin CT. Data normalization before statistical analysis: keeping the horse before the cart. Trends Pharmacol Sci. 1988;9(1):29–32. doi:10.1016/0165-6147(88)90239-8</p>
                <p>9. Kangave D. More enlightenment on the essence of applying Fisher's exact test when testing for statistical significance using small sample data presented in a 2 × 2 table. West Afr J Med. 1992;11(3):179–184.</p>
                <p>10. Pedersen T. Fishing for exactness. arXiv preprint cmp-lg/9608010. 1996.</p>
                <p>11. Lydersen S, Fagerland MW, Laake P. Recommended tests for association in 2 × 2 tables. Stat Med. 2009;28(7):1159–1175. doi:10.1002/sim.3531</p>
                <p>12. Warner P. Testing association with Fisher's exact test. J Fam Plann Reprod Health Care. 2013;39(4):281–284.</p>
                <p>13. Lyman S, Kirkley S, Ashikaga T, Anderson DD, Guanche CA, Sandmeier R. Letters to the editor. Am J Sports Med. 2000;28(6):918–921. doi:10.1177/03635465000280062701</p>
                <p>14. Hazra A, Gogtay N. Biostatistics series module 4: comparing groups – categorical variables. Indian J Dermatol. 2016;61(4):385–392. doi:10.4103/0019-5154.185700</p>
                <p>15. Dexter F, Chestnut DH. Analysis of statistical tests to compare visual analog scale measurements among groups. Anesthesiology. 1995;82(4):896–902. doi:10.1097/00000542-199504000-00012</p>
                <p>16. McKnight PE, Najab J. Mann-Whitney U Test. In: Weiner IB, Craighead WE, editors. The Corsini Encyclopedia of Psychology. Hoboken: Wiley; 2010. doi:10.1002/9780470479216.corpsy0524</p>
                <p>17. Rivas-Ruíz R, Moreno-Palacios J, Talavera JO. [Clinical research XVI. Differences between medians with the Mann-Whitney U test]. Rev Med Inst Mex Seguro Soc. 2013;51(4):414–419.</p>
                <p>18. Ostertagová E, Ostertag O, Kováč J. Methodology and application of the Kruskal-Wallis test. Appl Mech Mater. 2014;611:115–120. doi:10.4028/www.scientific.net/AMM.611.115</p>
                <p>19. Emerson RW. Parametric tests, their nonparametric alternatives, and degrees of freedom. J Vis Impair Blind. 2016;110(5):377–380. doi:10.1177/0145482X1611000511</p>
                <p>20. Kitchen CMR. Nonparametric vs parametric tests of location in biomedical research. Am J Ophthalmol. 2009;147(4):571–572.</p>
              </div>
            </div>
          </div>
          </TabsContent>
        </Tabs>
      </div>
    </main >
  );
}
