"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiFileText,
  FiPlus,
  FiExternalLink,
  FiEye,
  FiChevronLeft,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

function extractText(body: any): string {
  if (!body?.content) return "";
  return body.content
    .map((block: any) => {
      if (block.paragraph) {
        return block.paragraph.elements
          ?.map((el: any) => el.textRun?.content || "")
          .join("");
      }
      if (block.table) {
        return block.table.tableRows
          ?.map((row: any) =>
            row.tableCells
              ?.map((cell: any) => extractText(cell))
              .join("\t")
          )
          .join("\n");
      }
      return "";
    })
    .join("");
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [docContent, setDocContent] = useState<string>("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [showInsert, setShowInsert] = useState(false);
  const [insertText, setInsertText] = useState("");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google/docs?action=list");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDocuments(data.files || []);
    } catch (e: any) {
      toast.error(`문서 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/google/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("문서 생성 완료");
      setShowCreate(false);
      setTitle("");
      fetchDocs();
    } catch (e: any) {
      toast.error(`생성 실패: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const openDoc = async (doc: any) => {
    setViewDoc(doc);
    setLoadingDoc(true);
    try {
      const res = await fetch(
        `/api/google/docs?action=get&documentId=${doc.id}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDocContent(extractText(data.body));
    } catch (e: any) {
      toast.error(`문서 로드 실패: ${e.message}`);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleInsert = async () => {
    if (!insertText.trim() || !viewDoc) return;
    try {
      const res = await fetch("/api/google/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          documentId: viewDoc.id,
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: insertText + "\n",
              },
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("텍스트 삽입 완료");
      setShowInsert(false);
      setInsertText("");
      openDoc(viewDoc);
    } catch (e: any) {
      toast.error(`삽입 실패: ${e.message}`);
    }
  };

  if (viewDoc) {
    return (
      <div>
        <button
          onClick={() => {
            setViewDoc(null);
            setDocContent("");
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiChevronLeft /> 목록으로
        </button>

        <PageHeader
          title={viewDoc.name}
          description="Google 문서"
          actions={
            <>
              <button
                onClick={() => setShowInsert(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus /> 텍스트 삽입
              </button>
              {viewDoc.webViewLink && (
                <a
                  href={viewDoc.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiExternalLink /> Google에서 편집
                </a>
              )}
            </>
          }
        />

        <div className="card">
          {loadingDoc ? (
            <LoadingSpinner />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {docContent || "(빈 문서)"}
            </pre>
          )}
        </div>

        <Modal
          open={showInsert}
          onClose={() => setShowInsert(false)}
          title="텍스트 삽입"
          wide
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              문서의 맨 앞에 텍스트를 삽입합니다
            </p>
            <textarea
              value={insertText}
              onChange={(e) => setInsertText(e.target.value)}
              placeholder="삽입할 텍스트..."
              className="input min-h-[150px]"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInsert(false)}
                className="btn-secondary"
              >
                취소
              </button>
              <button onClick={handleInsert} className="btn-primary">
                삽입
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
        title="Docs"
        description="Google 문서 관리"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> 새 문서
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="문서가 없습니다"
            description="새 문서를 만들어보세요"
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
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <FiFileText className="text-google-blue flex-shrink-0" />
                      <span className="truncate max-w-md">{doc.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">
                    {new Date(doc.modifiedTime).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDoc(doc)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="보기"
                      >
                        <FiEye />
                      </button>
                      {doc.webViewLink && (
                        <a
                          href={doc.webViewLink}
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
        title="새 문서"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문서 제목"
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
