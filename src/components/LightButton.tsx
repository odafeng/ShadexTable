"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface LightButtonProps {
  text: string;
  href: string;
}

export default function LightButton({ text, href }: LightButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all flex items-center justify-center gap-3"
        style={{
          width: "252px",
          height: "65px",
          fontSize: "23px",
          letterSpacing: "2.5px",
          lineHeight: "37px",
          fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
        }}
      >
        <Image
          src={
            hover
              ? "/landing/arrow_13147905@2x.png"
              : "/landing/arrow_2_white@2x.png"
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
