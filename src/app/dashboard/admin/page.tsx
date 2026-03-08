"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiShield,
  FiUsers,
  FiUser,
  FiSearch,
  FiMail,
  FiCheck,
  FiX,
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "groups">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchUsers = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "users" });
      if (query) params.set("query", query);
      const res = await fetch(`/api/google/admin?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (e: any) {
      toast.error(`사용자 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google/admin?action=groups");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroups(data.groups || []);
    } catch (e: any) {
      toast.error(`그룹 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "users") fetchUsers();
    else fetchGroups();
  }, [tab, fetchUsers, fetchGroups]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "users") fetchUsers(search);
  };

  const loadGroupMembers = async (group: any) => {
    setSelectedGroup(group);
    setLoadingMembers(true);
    try {
      const res = await fetch(
        `/api/google/admin?action=groupMembers&groupKey=${group.email}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroupMembers(data.members || []);
    } catch (e: any) {
      toast.error(`멤버 로드 실패: ${e.message}`);
    } finally {
      setLoadingMembers(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Google Workspace 관리자"
      />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "users"
              ? "bg-google-blue text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <FiUser className="inline mr-2" />
          사용자
        </button>
        <button
          onClick={() => setTab("groups")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "groups"
              ? "bg-google-blue text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <FiUsers className="inline mr-2" />
          그룹
        </button>
      </div>

      {tab === "users" && (
        <>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="사용자 검색 (이름 또는 이메일)..."
                className="input pl-10"
              />
            </div>
          </form>

          <div className="card p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : users.length === 0 ? (
              <EmptyState
                icon={FiShield}
                title="사용자 없음"
                description="Admin API 접근 권한이 필요합니다"
              />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">이름</th>
                    <th className="table-header">이메일</th>
                    <th className="table-header">상태</th>
                    <th className="table-header">관리자</th>
                    <th className="table-header">마지막 로그인</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          {user.thumbnailPhotoUrl ? (
                            <img
                              src={user.thumbnailPhotoUrl}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                              {user.name?.fullName?.[0] || "?"}
                            </div>
                          )}
                          <span>{user.name?.fullName}</span>
                        </div>
                      </td>
                      <td className="table-cell text-gray-500">
                        {user.primaryEmail}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.suspended
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.suspended ? "정지됨" : "활성"}
                        </span>
                      </td>
                      <td className="table-cell">
                        {user.isAdmin ? (
                          <FiCheck className="text-google-green" />
                        ) : (
                          <FiX className="text-gray-300" />
                        )}
                      </td>
                      <td className="table-cell text-gray-500">
                        {user.lastLoginTime
                          ? new Date(user.lastLoginTime).toLocaleDateString(
                              "ko-KR"
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === "groups" && (
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="card p-0 overflow-hidden">
              {loading ? (
                <LoadingSpinner />
              ) : groups.length === 0 ? (
                <EmptyState
                  icon={FiUsers}
                  title="그룹 없음"
                  description="Admin API 접근 권한이 필요합니다"
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => loadGroupMembers(group)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedGroup?.id === group.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                          <FiUsers className="text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{group.name}</h4>
                          <p className="text-xs text-gray-500">
                            {group.email}
                          </p>
                        </div>
                        {group.directMembersCount && (
                          <span className="ml-auto text-xs text-gray-400">
                            {group.directMembersCount}명
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedGroup && (
            <div className="w-80">
              <div className="card">
                <h3 className="font-semibold mb-3">
                  {selectedGroup.name} 멤버
                </h3>
                {loadingMembers ? (
                  <LoadingSpinner />
                ) : groupMembers.length === 0 ? (
                  <p className="text-sm text-gray-500">멤버가 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {groupMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <FiMail className="text-gray-400" />
                        <div>
                          <p className="truncate">{member.email}</p>
                          <p className="text-xs text-gray-400">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
