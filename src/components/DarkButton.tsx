"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface DarkButtonProps {
  text: string;
  href: string;
}

export default function DarkButton({ text, href }: DarkButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="rounded-full border text-[#0F2844] bg-transparent hover:bg-[#0F2844] hover:text-white border-[#0F2844] transition-all flex items-center justify-center gap-3"
        style={{
          width: "200px",
          height: "65px",
          fontSize: "20px",
          letterSpacing: "2.5px",
          lineHeight: "37px",
          fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
          marginTop: "85px",
        }}
      >
        <Image
          src={
            hover
              ? "/landing/arrow_2_white@2x.png"
              : "/landing/arrow_13147905@2x.png"
          }
          alt="arrow"
          width={24}
          height={24}
        />
        {text}
      </motion.button>
    </Link>
  );
}
