"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [hoverLogout, setHoverLogout] = useState(false);
  const [hoverDashboard, setHoverDashboard] = useState(false);

  return (
    <header
      className="w-full"
      style={{
        backgroundColor: "#EEF2F9",
        height: "90px",
        minWidth: "1920px",
      }}
    >
      <div className="container-custom flex justify-between items-center h-full">
        {/* ✅ LOGO */}
        <Image
          src="/landing/logo@2x.png"
          alt="ShadyTable Logo"
          width={270.39}
          height={50}
          priority
        />

        {/* ✅ 右上角功能區 */}
        <div className="flex items-center gap-6">
          {/* 登出區塊 */}
          <button
            onMouseEnter={() => setHoverLogout(true)}
            onMouseLeave={() => setHoverLogout(false)}
            className="flex items-center gap-2"
          >
            <Image
              src={
                hoverLogout
                  ? "/header/icon@2x.png"
                  : "/header/logout_icon@2x.png"
              }
              alt="logout"
              width={24}
              height={24}
            />
            <span
              style={{
                fontSize: "15px",
                letterSpacing: "2px",
                lineHeight: "32px",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                color: hoverLogout ? "#008587" : "#000000",
                transition: "color 0.3s ease",
              }}
            >
              登出
            </span>
          </button>

          {/* 控制台按鈕 */}
          <Link href="/dashboard">
            <button
              onMouseEnter={() => setHoverDashboard(true)}
              onMouseLeave={() => setHoverDashboard(false)}
              className="flex items-center justify-center gap-2 rounded-full border transition-all"
              style={{
                width: "120px",
                height: "40px",
                backgroundColor: hoverDashboard ? "#00858700" : "#008587",
                borderColor: "#008587",
                borderWidth: "1px",
                fontSize: "15px",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                color: hoverDashboard ? "#008587" : "#FFFFFF",
              }}
            >
              <Image
                src={
                  hoverDashboard
                    ? "/header/gear_17637667@2x.png"
                    : "/header/control_icon@2x.png"
                }
                alt="dashboard"
                width={16}
                height={16}
              />
              控制台
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
