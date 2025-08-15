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
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`cursor-pointer rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all duration-200 flex items-center justify-center gap-2 px-4 py-1.5 text-sm sm:text-base ${className}`}
        style={{
          fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
        }}
      >
        <Image
          src={hover ? "/landing/arrow_13147905@2x.png" : "/landing/arrow_2_white@2x.png"}
          alt="arrow"
          width={25}
          height={25}
        />
        {text}
      </motion.button>
    </Link>
  );
}
