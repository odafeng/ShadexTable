import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { data } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "❌ Missing OpenAI API Key" }, { status: 500 });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "你是一位協助撰寫醫學論文的AI助手。請根據下列Table 1統計結果，用一段正式學術英文簡短撰寫約200字Results摘要段落，不需要推論，只需要描述各變項的敘述統計與p值的差異即可。",
          },
          {
            role: "user",
            content: data,
          },
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    const json = await openaiRes.json();

    // 如果 OpenAI 有錯誤就回報
    if (!openaiRes.ok) {
      console.error("OpenAI error:", json);
      return NextResponse.json({ error: json.error?.message || "OpenAI API error" }, { status: 500 });
    }

    const content = json.choices?.[0]?.message?.content || "❌ 無法產生摘要";
    return NextResponse.json({ summary: content });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "OpenAI API request failed" }, { status: 500 });
  }
}
