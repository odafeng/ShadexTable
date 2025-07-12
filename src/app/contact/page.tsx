"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: 這裡可以串 API 或發 email
    console.log({ name, email, message });

    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <h1 className="text-3xl font-bold mb-6">聯絡與回饋</h1>

      {submitted ? (
        <div className="text-green-600 font-medium">
          ✅ 感謝您的回饋，我們已收到您的訊息！
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">姓名</label>
            <input
              type="text"
              required
              className="mt-1 w-full border px-3 py-2 rounded shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="請輸入您的姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              className="mt-1 w-full border px-3 py-2 rounded shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="方便聯絡您的電子信箱"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">訊息內容</label>
            <textarea
              required
              className="mt-1 w-full border px-3 py-2 rounded shadow-sm"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="請寫下您的問題、建議或回饋，我們會盡快回覆您"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            送出
          </button>
        </form>
      )}
    </div>
  );
}
