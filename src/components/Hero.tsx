import Image from "next/image";
import { useState } from "react";

export default function Hero() {
  const [leftHover, setLeftHover] = useState(false);
  const [rightHover, setRightHover] = useState(false);

  return (
    <section
      className="relative w-full bg-cover bg-center bg-no-repeat pt-20 pb-10"
      style={{ backgroundImage: "url('/landing/banner_bg.png')" }}
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* 左側文案區 */}
          <div className="h-[360px] flex flex-col justify-between">
            <div className="space-y-8">
            <h1
              className="text-[#0F2844] font-semibold leading-[62px]"
              style={{ fontSize: "45px", letterSpacing: "5px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              臨床研究分析，一鍵完成
            </h1>
            <p
              className="text-[#0F2844] font-normal leading-[42px]"
              style={{ fontSize: "25px", letterSpacing: "3px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              全台灣第一款專為臨床研究人員打造的<br></br>雲端統計工具
            </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
{/* 左側按鈕 */}
<button
  onMouseEnter={() => setLeftHover(true)}
  onMouseLeave={() => setLeftHover(false)}
  className="rounded-full border text-[#0F2844] bg-transparent hover:bg-[#0F2844] hover:text-white border-[#0F2844] transition-all flex items-center justify-center gap-3"
  style={{
    width: "300px",
    height: "65px",
    fontSize: "25px",
    letterSpacing: "2.5px",
    lineHeight: "37px",
    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
  }}
>
  <Image
    src={leftHover ? "/landing/play_13198001@2x.png" : "/landing/video_icon@2x.png"}
    alt="arrow"
    width={24}
    height={24}
  />
  觀看示範影片
</button>

{/* 右側按鈕 */}
<button
  onMouseEnter={() => setRightHover(true)}
  onMouseLeave={() => setRightHover(false)}
  className="rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all flex items-center justify-center gap-3"
  style={{
    width: "300px",
    height: "65px",
    fontSize: "25px",
    letterSpacing: "2.5px",
    lineHeight: "37px",
    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
  }}
>
  <Image
    src={rightHover ? "/landing/arrow_13147905@2x.png" : "/landing/arrow_2_white@2x.png"}
    alt="video"
    width={24}
    height={24}
  />
  立即開始分析
</button>

            </div>
          </div>

          {/* 右側影片區 */}
          <div className="relative w-full max-w-xl mx-auto">
            <video
              width={640}
              height={360}
              autoPlay
              loop
              muted
              playsInline
              className="rounded-xl shadow-lg border"
            >
              <source
                src="https://res.cloudinary.com/dpmewq6aj/video/upload/v1752251893/landing_demo_imou3s.mp4"
                type="video/mp4"
              />
              您的瀏覽器不支援影片播放。
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}