"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiClock,
  FiMapPin,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

const COLOR_MAP: Record<string, string> = {
  "1": "bg-blue-100 text-blue-800 border-blue-300",
  "2": "bg-green-100 text-green-800 border-green-300",
  "3": "bg-purple-100 text-purple-800 border-purple-300",
  "4": "bg-pink-100 text-pink-800 border-pink-300",
  "5": "bg-yellow-100 text-yellow-800 border-yellow-300",
  default: "bg-blue-100 text-blue-800 border-blue-300",
};

function formatTime(dateTime: string | undefined, date: string | undefined) {
  if (date) return "종일";
  if (!dateTime) return "";
  return new Date(dateTime).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [form, setForm] = useState({
    summary: "",
    description: "",
    location: "",
    start: "",
    end: "",
    attendees: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const timeMin = new Date(
        month.getFullYear(),
        month.getMonth(),
        1
      ).toISOString();
      const timeMax = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();
      const res = await fetch(
        `/api/google/calendar?timeMin=${timeMin}&timeMax=${timeMax}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvents(data.items || []);
    } catch (e: any) {
      toast.error(`캘린더 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async () => {
    if (!form.summary || !form.start || !form.end) {
      toast.error("제목, 시작, 종료 시간을 입력하세요");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("일정 생성 완료");
      setShowCreate(false);
      setForm({
        summary: "",
        description: "",
        location: "",
        start: "",
        end: "",
        attendees: "",
      });
      fetchEvents();
    } catch (e: any) {
      toast.error(`생성 실패: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch("/api/google/calendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("삭제 완료");
      fetchEvents();
    } catch (e: any) {
      toast.error(`삭제 실패: ${e.message}`);
    }
  };

  const prevMonth = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  // Group events by date
  const grouped = events.reduce(
    (acc: Record<string, any[]>, event) => {
      const dateStr =
        event.start?.date ||
        new Date(event.start?.dateTime).toISOString().split("T")[0];
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(event);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Google 캘린더 일정 관리"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> 새 일정
          </button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
          <FiChevronLeft />
        </button>
        <h3 className="text-lg font-semibold">
          {month.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
          })}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
          <FiChevronRight />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState
          icon={FiCalendar}
          title="일정이 없습니다"
          description="이번 달에 일정이 없습니다"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              일정 만들기
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                {new Date(date + "T00:00:00").toLocaleDateString("ko-KR", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <div className="space-y-2">
                {grouped[date].map((event: any) => {
                  const color =
                    COLOR_MAP[event.colorId] || COLOR_MAP["default"];
                  return (
                    <div
                      key={event.id}
                      className={`card flex items-start justify-between border-l-4 ${color}`}
                    >
                      <div className="flex-1">
                        <h5 className="font-medium">{event.summary}</h5>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock size={12} />
                            {formatTime(
                              event.start?.dateTime,
                              event.start?.date
                            )}
                            {event.end?.dateTime &&
                              ` - ${formatTime(event.end?.dateTime, undefined)}`}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <FiMapPin size={12} />
                              {event.location}
                            </span>
                          )}
                          {event.attendees && (
                            <span className="flex items-center gap-1">
                              <FiUsers size={12} />
                              {event.attendees.length}명
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-400"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="새 일정"
        wide
      >
        <div className="space-y-4">
          <input
            type="text"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="일정 제목"
            className="input"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">시작</label>
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">종료</label>
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="장소"
            className="input"
          />
          <input
            type="text"
            value={form.attendees}
            onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            placeholder="참석자 (이메일, 쉼표 구분)"
            className="input"
          />
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="설명"
            className="input min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary"
            >
              {creating ? "생성 중..." : "생성"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
