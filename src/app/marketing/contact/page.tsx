"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import LightButton from "@/components/LightButton";
import { ReceiptText } from "lucide-react"

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
        className="bg-gradient-to-b from-[#E3E7F0] to-white py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container-custom max-w-3xl pb-20">
          <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] p-10">
            <h1 className="text-[34px] text-[#0F2844] font-semibold text-center mb-6 tracking-wide">
              聯絡我們
            </h1>
            <p className="text-center text-[#637381] text-[18px] mb-10">
              有任何疑問、建議或合作邀約，歡迎留言給我們，我們會盡快回覆您！
            </p>

            {submitted ? (
              <div className="text-center text-[#008587] font-semibold text-xl">
                🎉 已成功送出！我們會盡快與您聯繫。
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative pb-15">
                <div>
                  <label className="block mb-1 text-[#0F2844] font-medium">您的姓名</label>
                  <Input
                    type="text"
                    placeholder="王小明"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[#0F2844] font-medium">Email 信箱</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[#0F2844] font-medium">留言內容</label>
                  <Textarea
                    placeholder="請輸入您的訊息..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="absolute bottom-0 right-0">
                  <Button
                    type="submit"
                    className="rounded-full px-6 text-[20px] hover:bg-[#0F2844] hover:text-white bg-transparent text-[#0F2844] border border-[#0F2844] inline-flex items-center gap-2"
                  >
                    <ReceiptText className="w-5 h-5" />
                    送出表單
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-12 flex justify-center">
            <LightButton text="回首頁" href="/" />
          </div>
        </div>
      </motion.section>
      <Footer />
    </>
  );
}
