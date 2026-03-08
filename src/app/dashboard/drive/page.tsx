"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiHardDrive,
  FiUpload,
  FiFolderPlus,
  FiTrash2,
  FiExternalLink,
  FiSearch,
  FiFile,
  FiFolder,
  FiImage,
  FiFilm,
  FiMusic,
  FiFileText,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

function getFileIcon(mimeType: string) {
  if (mimeType === "application/vnd.google-apps.folder") return FiFolder;
  if (mimeType?.startsWith("image/")) return FiImage;
  if (mimeType?.startsWith("video/")) return FiFilm;
  if (mimeType?.startsWith("audio/")) return FiMusic;
  if (mimeType?.includes("document") || mimeType?.includes("text"))
    return FiFileText;
  return FiFile;
}

function formatSize(bytes: string | undefined) {
  if (!bytes) return "-";
  const b = parseInt(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function DrivePage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", `name contains '${query}'`);
      const res = await fetch(`/api/google/drive?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFiles(data.files || []);
    } catch (e: any) {
      toast.error(`Drive 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(search);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      const res = await fetch("/api/google/drive", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`"${file.name}" 업로드 완료`);
      setShowUpload(false);
      fetchFiles();
    } catch (e: any) {
      toast.error(`업로드 실패: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", folderName);
      formData.append("mimeType", "application/vnd.google-apps.folder");
      const res = await fetch("/api/google/drive", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`"${folderName}" 폴더 생성 완료`);
      setShowNewFolder(false);
      setFolderName("");
      fetchFiles();
    } catch (e: any) {
      toast.error(`폴더 생성 실패: ${e.message}`);
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/google/drive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("삭제 완료");
      fetchFiles();
    } catch (e: any) {
      toast.error(`삭제 실패: ${e.message}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Drive"
        description="Google Drive 파일 관리"
        actions={
          <>
            <button
              onClick={() => setShowNewFolder(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FiFolderPlus /> 새 폴더
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiUpload /> 업로드
            </button>
          </>
        }
      />

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="파일 검색..."
            className="input pl-10"
          />
        </div>
      </form>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : files.length === 0 ? (
          <EmptyState
            icon={FiHardDrive}
            title="파일이 없습니다"
            description="파일을 업로드하거나 폴더를 만들어보세요"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">이름</th>
                <th className="table-header">크기</th>
                <th className="table-header">수정일</th>
                <th className="table-header w-24">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                return (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Icon className="text-lg text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-md">{file.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatSize(file.size)}
                    </td>
                    <td className="table-cell text-gray-500">
                      {file.modifiedTime
                        ? new Date(file.modifiedTime).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="열기"
                          >
                            <FiExternalLink />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500"
                          title="삭제"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="파일 업로드"
      >
        <div className="space-y-4">
          <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-google-blue transition-colors">
            <FiUpload className="mx-auto text-3xl text-gray-400 mb-2" />
            <p className="text-gray-600">
              {uploading ? "업로드 중..." : "파일을 선택하세요"}
            </p>
            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        title="새 폴더"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="폴더 이름"
            className="input"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewFolder(false)}
              className="btn-secondary"
            >
              취소
            </button>
            <button onClick={handleCreateFolder} className="btn-primary">
              생성
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
