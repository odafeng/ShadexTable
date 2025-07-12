"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/messages"); // 若部署，建議改相對路徑
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("❌ 無法載入留言", err);
      }
    };
    fetchMessages();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-10">📬 留言</h1>
      {messages.length === 0 ? (
        <p className="text-center text-gray-500">目前尚無留言。</p>
      ) : (
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">{msg.name}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                <strong>Email：</strong> {msg.email}
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-gray-700 dark:text-gray-100 whitespace-pre-line leading-relaxed">
                {msg.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
