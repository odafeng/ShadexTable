import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t text-sm text-gray-600 py-6">
      <div className="container-custom flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} ShadyTable. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-primary">隱私權政策</Link>
          <Link href="/terms" className="hover:text-primary">使用條款</Link>
          <Link href="mailto:contact@shadytable.com" className="hover:text-primary">聯絡我們</Link>
        </div>
      </div>
    </footer>
  );
}
