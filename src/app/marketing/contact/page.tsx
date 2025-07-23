"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import LightButton from "@/components/LightButton";
import { ReceiptText } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("https://shadytable-backend.onrender.com/contact/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        const errData = await res.json();
        alert(`送出失敗：${errData.detail || "請稍後再試"}`);
      }
    } catch (err) {
      console.error(err);
      alert("發生錯誤，請稍後再試");
    }
  };

  return (
    <>
      <Header />
      <motion.section
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#E3E7F0] to-white px-4 sm:px-6 pt-[80px] sm:pt-[100px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl w-full pb-4 sm:pb-8 mx-0">
          <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] px-2 pb-0 sm:px-8 sm:p-6">
            <h1 className="text-[26px] sm:text-[34px] text-[#0F2844] font-medium sm:font-semibold text-center mb-2 tracking-wide">
              聯絡我們
            </h1>
            <p className="text-center text-[#637381] text-[16px] sm:text-[18px] mb-4 sm:mb-10 leading-relaxed">
              有任何疑問、建議或合作邀約，歡迎留言給我們，我們會盡快回覆您！
            </p>

            {submitted ? (
              <div className="text-center text-[#008587] font-semibold text-lg sm:text-xl">
                🎉 已成功送出！我們會盡快與您聯繫。
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative pb-20">
                <div>
                  <label className="text-[20px] sm:text-[25px] block mb-2 text-[#0F2844] font-medium">您的姓名</label>
                  <Input
                    type="text"
                    placeholder="賈寶玉"
                    className="placeholder:text-[20px] sm:placeholder:text-[25px] text-[20px] sm:text-[25px]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[20px] sm:text-[25px] block mb-2 text-[#0F2844] font-medium">Email 信箱</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="placeholder:text-[20px] sm:placeholder:text-[25px] text-[20px] sm:text-[25px]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[20px] sm:text-[25px] block mb-2 text-[#0F2844] font-medium">留言內容</label>
                  <Textarea
                    placeholder="請輸入您的訊息..."
                    className="placeholder:text-[20px] sm:placeholder:text-[25px] text-[20px] sm:text-[25px]"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="absolute bottom-8 right-0 sm:bottom-0 sm:right-0 w-full sm:w-auto flex justify-center sm:justify-end">
                  <Button
                    type="submit"
                    className="rounded-full px-6 py-2 text-[18px] sm:text-[20px] hover:bg-[#0F2844] hover:text-white bg-transparent text-[#0F2844] border border-[#0F2844] inline-flex items-center gap-2"
                  >
                    <ReceiptText className="w-5 h-5" />
                    送出表單
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 sm:mt-12 flex justify-center">
            <LightButton text="回首頁" href="/" />
          </div>
        </div>
      </motion.section>
      <Footer />
    </>
  );
}
