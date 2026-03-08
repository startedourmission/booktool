"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiHardDrive,
  FiMail,
  FiCalendar,
  FiGrid,
  FiFileText,
  FiMessageSquare,
  FiShield,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";

function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const CALLBACK_URL = "http://localhost:3000/api/auth/callback/google";

  const copyCallback = () => {
    navigator.clipboard.writeText(CALLBACK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Client ID와 Client Secret을 모두 입력하세요");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-google-blue">G</span>
            <span className="text-google-red">W</span>
            <span className="text-google-yellow">S</span>
            <span className="text-google-green"> Dashboard</span>
          </h1>
          <p className="text-gray-500">초기 설정</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i
                    ? "bg-google-green text-white"
                    : step === i
                      ? "bg-google-blue text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > i ? <FiCheck /> : i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${step > i ? "bg-google-green" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">1. Google Cloud 프로젝트 설정</h2>
            <p className="text-sm text-gray-600">
              아래 링크에서 Google Cloud Console로 이동하여 OAuth 클라이언트를 만들어주세요.
            </p>
            <a
              href="https://console.cloud.google.com/apis/credentials/oauthclient"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-google-blue text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <FiExternalLink /> Google Cloud Console 열기
            </a>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
              <p className="font-medium text-gray-700">설정 방법:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>프로젝트가 없으면 상단에서 새 프로젝트를 만드세요</li>
                <li>애플리케이션 유형: <strong>웹 애플리케이션</strong></li>
                <li>승인된 리디렉션 URI에 아래 주소를 추가하세요</li>
              </ol>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
              <code className="flex-1 text-sm text-gray-700 break-all">{CALLBACK_URL}</code>
              <button
                onClick={copyCallback}
                className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="복사"
              >
                {copied ? <FiCheck className="text-google-green" /> : <FiCopy />}
              </button>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 w-full btn-primary"
            >
              다음 <FiArrowRight />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">2. API 활성화</h2>
            <p className="text-sm text-gray-600">
              아래 링크를 클릭하면 필요한 API를 한번에 활성화할 수 있습니다.
            </p>
            <div className="space-y-2">
              {[
                { name: "Drive API", url: "https://console.cloud.google.com/apis/library/drive.googleapis.com" },
                { name: "Gmail API", url: "https://console.cloud.google.com/apis/library/gmail.googleapis.com" },
                { name: "Calendar API", url: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" },
                { name: "Sheets API", url: "https://console.cloud.google.com/apis/library/sheets.googleapis.com" },
                { name: "Docs API", url: "https://console.cloud.google.com/apis/library/docs.googleapis.com" },
              ].map((api) => (
                <a
                  key={api.name}
                  href={api.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm transition-colors"
                >
                  <FiExternalLink className="text-google-blue flex-shrink-0" />
                  {api.name}
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Chat API, Admin SDK는 선택사항입니다. 나중에 필요할 때 활성화해도 됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                <FiArrowLeft /> 이전
              </button>
              <button onClick={() => setStep(2)} className="flex-1 btn-primary flex items-center justify-center gap-2">
                다음 <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">3. 인증 정보 입력</h2>
            <p className="text-sm text-gray-600">
              OAuth 클라이언트 생성 후 받은 클라이언트 ID와 Secret을 붙여넣으세요.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                className="input font-mono text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="GOCSPX-xxxx"
                className="input font-mono text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <FiArrowLeft /> 이전
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary"
              >
                {saving ? "저장 중..." : "설정 완료"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <FiCheck className="text-3xl text-google-green" />
            </div>
            <h2 className="text-lg font-semibold">설정 완료!</h2>
            <p className="text-sm text-gray-600">
              서버를 재시작해야 설정이 적용됩니다.<br />
              터미널에서 <code className="bg-gray-100 px-2 py-0.5 rounded">Ctrl+C</code> 후 다시 <code className="bg-gray-100 px-2 py-0.5 rounded">npm run dev</code>를 실행하세요.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 text-left">
              <code className="text-green-400 text-sm">
                $ npm run dev
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              새로고침
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (session) router.push("/dashboard/drive");
  }, [session, router]);

  if (status === "loading" || configured === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-google-blue" />
      </div>
    );
  }

  if (!configured) {
    return <SetupWizard onComplete={() => setConfigured(true)} />;
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
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google 계정으로 로그인
      </button>

      <p className="mt-6 text-sm text-gray-400">
        로컬에서 실행 - 데이터는 Google 서버에만 저장됩니다
      </p>
    </div>
  );
}
