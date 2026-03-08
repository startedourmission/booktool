"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiMail,
  FiSend,
  FiTrash2,
  FiSearch,
  FiInbox,
  FiStar,
  FiTag,
  FiChevronLeft,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

function getHeader(msg: any, name: string) {
  return (
    msg?.payload?.headers?.find(
      (h: any) => h.name.toLowerCase() === name.toLowerCase()
    )?.value || ""
  );
}

function decodeBody(msg: any): string {
  const parts = msg?.payload?.parts || [];
  const htmlPart = parts.find((p: any) => p.mimeType === "text/html");
  const textPart = parts.find((p: any) => p.mimeType === "text/plain");
  const body =
    htmlPart?.body?.data || textPart?.body?.data || msg?.payload?.body?.data;
  if (!body) return "";
  return Buffer.from(body, "base64").toString("utf-8");
}

export default function GmailPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState("INBOX");
  const [labels, setLabels] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [compose, setCompose] = useState({
    to: "",
    cc: "",
    subject: "",
    body: "",
  });
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(
    async (query?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ labelIds: label });
        if (query) params.set("q", query);
        const res = await fetch(`/api/google/gmail?${params}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages(data.messages || []);
      } catch (e: any) {
        toast.error(`Gmail 로드 실패: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [label]
  );

  const fetchLabels = useCallback(async () => {
    try {
      const res = await fetch("/api/google/gmail?action=labels");
      const data = await res.json();
      if (data.labels) setLabels(data.labels);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchLabels();
  }, [fetchMessages, fetchLabels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages(search);
  };

  const openMessage = async (id: string) => {
    setLoadingMsg(true);
    try {
      const res = await fetch(`/api/google/gmail?action=get&id=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelectedMsg(data);
    } catch (e: any) {
      toast.error(`메일 로드 실패: ${e.message}`);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSend = async () => {
    if (!compose.to || !compose.subject) {
      toast.error("받는 사람과 제목을 입력하세요");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/google/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compose),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("메일 전송 완료");
      setShowCompose(false);
      setCompose({ to: "", cc: "", subject: "", body: "" });
      fetchMessages();
    } catch (e: any) {
      toast.error(`전송 실패: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleTrash = async (id: string) => {
    try {
      const res = await fetch("/api/google/gmail", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("휴지통으로 이동");
      if (selectedMsg?.id === id) setSelectedMsg(null);
      fetchMessages();
    } catch (e: any) {
      toast.error(`삭제 실패: ${e.message}`);
    }
  };

  const systemLabels = ["INBOX", "SENT", "STARRED", "DRAFT", "TRASH", "SPAM"];

  if (selectedMsg) {
    const body = decodeBody(selectedMsg);
    return (
      <div>
        <button
          onClick={() => setSelectedMsg(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiChevronLeft /> 목록으로
        </button>
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">
              {getHeader(selectedMsg, "Subject") || "(제목 없음)"}
            </h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p>
                <span className="font-medium">보낸 사람:</span>{" "}
                {getHeader(selectedMsg, "From")}
              </p>
              <p>
                <span className="font-medium">받는 사람:</span>{" "}
                {getHeader(selectedMsg, "To")}
              </p>
              <p>
                <span className="font-medium">날짜:</span>{" "}
                {getHeader(selectedMsg, "Date")}
              </p>
            </div>
          </div>
          {body.startsWith("<") ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {body}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gmail"
        description="이메일 관리"
        actions={
          <button
            onClick={() => setShowCompose(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiSend /> 새 메일
          </button>
        }
      />

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <div className="space-y-1">
            {systemLabels.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  label === l
                    ? "bg-blue-50 text-google-blue"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {l === "INBOX" && <FiInbox />}
                {l === "STARRED" && <FiStar />}
                {l === "SENT" && <FiSend />}
                {!["INBOX", "STARRED", "SENT"].includes(l) && <FiTag />}
                {l}
              </button>
            ))}
            {labels
              .filter((l) => l.type === "user")
              .map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLabel(l.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    label === l.id
                      ? "bg-blue-50 text-google-blue"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FiTag />
                  {l.name}
                </button>
              ))}
          </div>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="메일 검색..."
                className="input pl-10"
              />
            </div>
          </form>

          <div className="card p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={FiMail}
                title="메일이 없습니다"
                description="이 라벨에 메일이 없습니다"
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((msg) => {
                  const isUnread = msg.labelIds?.includes("UNREAD");
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        isUnread ? "bg-blue-50/30 font-semibold" : ""
                      }`}
                      onClick={() => openMessage(msg.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm truncate w-48">
                            {getHeader(msg, "From")?.split("<")[0]?.trim()}
                          </span>
                          <span className="text-sm truncate flex-1">
                            {getHeader(msg, "Subject") || "(제목 없음)"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {getHeader(msg, "Date")
                          ? new Date(
                              getHeader(msg, "Date")
                            ).toLocaleDateString("ko-KR")
                          : ""}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrash(msg.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showCompose}
        onClose={() => setShowCompose(false)}
        title="새 메일"
        wide
      >
        <div className="space-y-4">
          <input
            type="email"
            value={compose.to}
            onChange={(e) => setCompose({ ...compose, to: e.target.value })}
            placeholder="받는 사람"
            className="input"
            autoFocus
          />
          <input
            type="text"
            value={compose.cc}
            onChange={(e) => setCompose({ ...compose, cc: e.target.value })}
            placeholder="참조 (CC)"
            className="input"
          />
          <input
            type="text"
            value={compose.subject}
            onChange={(e) =>
              setCompose({ ...compose, subject: e.target.value })
            }
            placeholder="제목"
            className="input"
          />
          <textarea
            value={compose.body}
            onChange={(e) => setCompose({ ...compose, body: e.target.value })}
            placeholder="내용을 입력하세요..."
            className="input min-h-[200px]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCompose(false)}
              className="btn-secondary"
            >
              취소
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary flex items-center gap-2"
            >
              <FiSend /> {sending ? "전송 중..." : "보내기"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
