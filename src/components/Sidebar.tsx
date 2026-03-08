"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  FiHardDrive,
  FiMail,
  FiCalendar,
  FiGrid,
  FiFileText,
  FiMessageSquare,
  FiShield,
  FiLogOut,
} from "react-icons/fi";

const navItems = [
  { href: "/dashboard/drive", icon: FiHardDrive, label: "Drive" },
  { href: "/dashboard/gmail", icon: FiMail, label: "Gmail" },
  { href: "/dashboard/calendar", icon: FiCalendar, label: "Calendar" },
  { href: "/dashboard/sheets", icon: FiGrid, label: "Sheets" },
  { href: "/dashboard/docs", icon: FiFileText, label: "Docs" },
  { href: "/dashboard/chat", icon: FiMessageSquare, label: "Chat" },
  { href: "/dashboard/admin", icon: FiShield, label: "Admin" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-5 border-b border-gray-200">
        <Link href="/dashboard/drive" className="flex items-center gap-2">
          <h1 className="text-xl font-bold">
            <span className="text-google-blue">G</span>
            <span className="text-google-red">W</span>
            <span className="text-google-yellow">S</span>
            <span className="text-gray-700"> Dashboard</span>
          </h1>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-google-blue"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="text-lg" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        {session?.user && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors w-full"
        >
          <FiLogOut className="text-lg" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
