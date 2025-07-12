"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("https://shadytable-backend.onrender.com/api/contact", {
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
    <motion.div
      className="max-w-2xl mx-auto px-4 py-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-center mb-8">聯絡我們</h1>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-12">
        有任何疑問、建議或合作邀約，歡迎留言給我們，我們會盡快回覆您！
      </p>

      {submitted ? (
        <div className="text-center text-green-600 font-semibold">
          🎉 已成功送出！我們會盡快與您聯繫。
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white dark:bg-[#1E293B] p-8 rounded-2xl shadow-lg border dark:border-gray-700"
        >
          <div>
            <label className="block mb-1 font-medium">您的姓名</label>
            <Input
              type="text"
              placeholder="王小明"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email 信箱</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">留言內容</label>
            <Textarea
              placeholder="請輸入您的訊息..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 text-right">
            <Button type="submit" className="px-6">
              送出表單
            </Button>
          </div>
        </form>
      )}

      <div className="text-center mt-10">
        <Link href="/">
          <Button variant="ghost">← 返回首頁</Button>
        </Link>
      </div>
    </motion.div>
  );
}
