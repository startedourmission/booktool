"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiHardDrive,
  FiMail,
  FiCalendar,
  FiGrid,
  FiFileText,
  FiMessageSquare,
  FiShield,
} from "react-icons/fi";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard/drive");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-google-blue" />
      </div>
    );
  }

  const features = [
    { icon: FiHardDrive, label: "Drive", desc: "파일 관리, 업로드, 다운로드" },
    { icon: FiMail, label: "Gmail", desc: "메일 읽기, 보내기, 라벨 관리" },
    { icon: FiCalendar, label: "Calendar", desc: "일정 생성, 수정, 삭제" },
    { icon: FiGrid, label: "Sheets", desc: "스프레드시트 데이터 관리" },
    { icon: FiFileText, label: "Docs", desc: "문서 생성 및 편집" },
    { icon: FiMessageSquare, label: "Chat", desc: "스페이스 및 메시지" },
    { icon: FiShield, label: "Admin", desc: "사용자 및 그룹 관리" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-google-blue">G</span>
          <span className="text-google-red">W</span>
          <span className="text-google-yellow">S</span>
          <span className="text-google-green"> Dashboard</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Google Workspace의 모든 기능을 한 곳에서
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-2xl">
        {features.map((f) => (
          <div
            key={f.label}
            className="card flex flex-col items-center text-center p-4"
          >
            <f.icon className="text-2xl text-google-blue mb-2" />
            <span className="font-medium text-sm">{f.label}</span>
            <span className="text-xs text-gray-500 mt-1">{f.desc}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard/drive" })}
        className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:shadow-md transition-shadow"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google 계정으로 로그인
      </button>

      <p className="mt-6 text-sm text-gray-400">
        로컬에서 실행 - 데이터는 Google 서버에만 저장됩니다
      </p>
    </div>
  );
}
