"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  {
    name: "上傳資料",
    href: "/step1_v2",
    icon: "/locationbar/step1_icon@2x.png",
    iconActive: "/locationbar/step1_icon_active@2x.png",
    iconWidth: 30,
    iconHeight: 30,
  },
  {
    name: "變項選擇",
    href: "/step2_v2",
    icon: "/locationbar/step2_icon@2x.png",
    iconActive: "/locationbar/step2_icon_active@2x.png",
    iconWidth: 22.04,
    iconHeight: 30,
  },
  {
    name: "統計摘要",
    href: "/step3_v2",
    icon: "/locationbar/step3_icon@2x.png",
    iconActive: "/locationbar/step3_icon_active@2x.png",
    iconWidth: 23.48,
    iconHeight: 30,
  },
];

export default function StepNavigator() {
  const pathname = usePathname();

  return (
    <div className="flex items-start justify-center py-6">
      {steps.map((step, index) => {
        const isActive = pathname.startsWith(step.href);

        return (
          <div key={step.name} className="flex items-center">
            {/* Step */}
            <Link href={step.href} className="flex flex-col items-center space-y-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  isActive
                    ? "bg-white border-[#114A8B] shadow-md"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Image
                  src={isActive ? step.iconActive : step.icon}
                  alt={step.name}
                  width={step.iconWidth}
                  height={step.iconHeight}
                />
              </div>

              <span
                className={`text-[20px] leading-[32px] tracking-[2px] ${
                  isActive ? "text-[#114A8B]" : "text-gray-400"
                }`}
              >
                {step.name}
              </span>
            </Link>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className="flex items-center" style={{ transform: "translateY(-25px)" }}>
                <div className="w-12 h-px bg-gray-300 mx-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
