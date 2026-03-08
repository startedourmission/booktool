"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiMessageSquare,
  FiSend,
  FiUsers,
  FiChevronLeft,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function ChatPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google/chat?action=spaces");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSpaces(data.spaces || []);
    } catch (e: any) {
      toast.error(`스페이스 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const openSpace = async (space: any) => {
    setSelectedSpace(space);
    setLoadingMsgs(true);
    try {
      const res = await fetch(
        `/api/google/chat?action=messages&spaceName=${space.name}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((data.messages || []).reverse());
    } catch (e: any) {
      toast.error(`메시지 로드 실패: ${e.message}`);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedSpace) return;
    setSending(true);
    try {
      const res = await fetch("/api/google/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceName: selectedSpace.name,
          text: newMessage,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewMessage("");
      openSpace(selectedSpace);
    } catch (e: any) {
      toast.error(`전송 실패: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  if (selectedSpace) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              setSelectedSpace(null);
              setMessages([]);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiChevronLeft />
          </button>
          <div>
            <h2 className="text-xl font-bold">
              {selectedSpace.displayName || selectedSpace.name}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedSpace.spaceType === "DIRECT_MESSAGE"
                ? "다이렉트 메시지"
                : "스페이스"}
            </p>
          </div>
        </div>

        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs ? (
              <LoadingSpinner />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={FiMessageSquare}
                title="메시지 없음"
                description="이 스페이스에 메시지가 없습니다"
              />
            ) : (
              messages.map((msg) => (
                <div key={msg.name} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-google-blue text-white flex items-center justify-center text-xs flex-shrink-0">
                    {msg.sender?.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {msg.sender?.displayName || "알 수 없음"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {msg.createTime
                          ? new Date(msg.createTime).toLocaleString("ko-KR")
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지 입력..."
                className="input"
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Chat" description="Google Chat 스페이스 및 메시지" />

      {loading ? (
        <LoadingSpinner />
      ) : spaces.length === 0 ? (
        <EmptyState
          icon={FiMessageSquare}
          title="스페이스가 없습니다"
          description="Google Chat에 참여 중인 스페이스가 없습니다"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <button
              key={space.name}
              onClick={() => openSpace(space)}
              className="card text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-google-blue text-white flex items-center justify-center font-medium">
                  {(space.displayName || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {space.displayName || space.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {space.spaceType === "DIRECT_MESSAGE"
                      ? "DM"
                      : space.spaceType === "SPACE"
                        ? "스페이스"
                        : space.spaceType}
                  </p>
                </div>
              </div>
              {space.spaceDetails?.description && (
                <p className="text-sm text-gray-500 truncate">
                  {space.spaceDetails.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
