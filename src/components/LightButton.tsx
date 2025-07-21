"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface LightButtonProps {
  text: string;
  href: string;
  className?: string;
}

export default function LightButton({ text, href, className = "" }: LightButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all flex items-center justify-center gap-2 px-5 py-2 sm:px-6 sm:py-3 text-base sm:text-lg ${className}`}
        style={{
          fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
        }}
      >
        <Image
          src={hover ? "/landing/arrow_13147905@2x.png" : "/landing/arrow_2_white@2x.png"}
          alt="arrow"
          width={20}
          height={20}
        />
        {text}
      </motion.button>
    </Link>
  );
}
