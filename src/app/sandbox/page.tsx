export default function SandboxPage() {
  return (
    <div className="p-12 bg-gray-100 min-h-screen">
      <div className="relative group inline-block">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          註冊
        </button>

        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 
          bg-blue-500 text-white text-xs px-3 py-[2px] rounded-full shadow-lg 
          opacity-0 group-hover:opacity-100 transition 
          whitespace-nowrap min-w-fit text-center z-50">
          🎁 註冊即送 1 點
        </div>
      </div>
    </div>
  );
}
