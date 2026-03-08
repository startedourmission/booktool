"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiGrid,
  FiPlus,
  FiExternalLink,
  FiSearch,
  FiEye,
  FiChevronLeft,
  FiEdit2,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function SheetsPage() {
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewSheet, setViewSheet] = useState<any>(null);
  const [sheetData, setSheetData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [showAppend, setShowAppend] = useState(false);
  const [appendRow, setAppendRow] = useState("");

  const fetchSheets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google/sheets?action=list");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSpreadsheets(data.files || []);
    } catch (e: any) {
      toast.error(`스프레드시트 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/google/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("스프레드시트 생성 완료");
      setShowCreate(false);
      setTitle("");
      fetchSheets();
    } catch (e: any) {
      toast.error(`생성 실패: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const openSheet = async (sheet: any) => {
    setViewSheet(sheet);
    setLoadingData(true);
    try {
      const metaRes = await fetch(
        `/api/google/sheets?action=get&spreadsheetId=${sheet.id}`
      );
      const meta = await metaRes.json();
      if (meta.error) throw new Error(meta.error);

      const firstSheet = meta.sheets?.[0]?.properties?.title || "Sheet1";
      setSelectedTab(firstSheet);
      setViewSheet({ ...sheet, sheets: meta.sheets });

      const valRes = await fetch(
        `/api/google/sheets?action=values&spreadsheetId=${sheet.id}&range=${firstSheet}`
      );
      const valData = await valRes.json();
      setSheetData(valData.values || []);
    } catch (e: any) {
      toast.error(`시트 로드 실패: ${e.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTab = async (tabName: string) => {
    setSelectedTab(tabName);
    setLoadingData(true);
    try {
      const res = await fetch(
        `/api/google/sheets?action=values&spreadsheetId=${viewSheet.id}&range=${tabName}`
      );
      const data = await res.json();
      setSheetData(data.values || []);
    } catch (e: any) {
      toast.error(`탭 로드 실패: ${e.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAppend = async () => {
    if (!appendRow.trim()) return;
    try {
      const values = [appendRow.split("\t")];
      const res = await fetch("/api/google/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "append",
          spreadsheetId: viewSheet.id,
          range: selectedTab,
          values,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("행 추가 완료");
      setShowAppend(false);
      setAppendRow("");
      loadTab(selectedTab);
    } catch (e: any) {
      toast.error(`추가 실패: ${e.message}`);
    }
  };

  if (viewSheet) {
    return (
      <div>
        <button
          onClick={() => {
            setViewSheet(null);
            setSheetData(null);
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiChevronLeft /> 목록으로
        </button>

        <PageHeader
          title={viewSheet.name}
          description="스프레드시트 데이터"
          actions={
            <button
              onClick={() => setShowAppend(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> 행 추가
            </button>
          }
        />

        {viewSheet.sheets && (
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {viewSheet.sheets.map((s: any) => (
              <button
                key={s.properties.sheetId}
                onClick={() => loadTab(s.properties.title)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === s.properties.title
                    ? "border-google-blue text-google-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {s.properties.title}
              </button>
            ))}
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          {loadingData ? (
            <LoadingSpinner />
          ) : !sheetData || sheetData.length === 0 ? (
            <EmptyState
              icon={FiGrid}
              title="데이터 없음"
              description="이 시트에 데이터가 없습니다"
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header w-12">#</th>
                  {sheetData[0]?.map((_: any, i: number) => (
                    <th key={i} className="table-header">
                      {String.fromCharCode(65 + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sheetData.map((row: any[], rowIdx: number) => (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-400 font-mono">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell: string, cellIdx: number) => (
                      <td key={cellIdx} className="table-cell">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Modal
          open={showAppend}
          onClose={() => setShowAppend(false)}
          title="행 추가"
          wide
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              탭(Tab)으로 구분하여 각 셀 값을 입력하세요
            </p>
            <input
              type="text"
              value={appendRow}
              onChange={(e) => setAppendRow(e.target.value)}
              placeholder="값1	값2	값3"
              className="input font-mono"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAppend(false)}
                className="btn-secondary"
              >
                취소
              </button>
              <button onClick={handleAppend} className="btn-primary">
                추가
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sheets"
        description="Google 스프레드시트 관리"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> 새 스프레드시트
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : spreadsheets.length === 0 ? (
          <EmptyState
            icon={FiGrid}
            title="스프레드시트가 없습니다"
            description="새 스프레드시트를 만들어보세요"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">이름</th>
                <th className="table-header">수정일</th>
                <th className="table-header w-32">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {spreadsheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <FiGrid className="text-google-green flex-shrink-0" />
                      <span className="truncate max-w-md">{sheet.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">
                    {new Date(sheet.modifiedTime).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openSheet(sheet)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="보기"
                      >
                        <FiEye />
                      </button>
                      {sheet.webViewLink && (
                        <a
                          href={sheet.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Google에서 열기"
                        >
                          <FiExternalLink />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="새 스프레드시트"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="스프레드시트 제목"
            className="input"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
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
