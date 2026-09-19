"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import Loading from "@/components/Loading";
import { SafeUser } from "@/types";
import { apiFetch } from "@/lib/apiClient";
import {
  Users,
  UserPlus,
  Shield,
  User as UserIcon,
  Trash2,
  Edit2,
  KeyRound,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modal Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Modal Edit
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "staff">("staff");
  const [editPassword, setEditPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else if (res.status === 401) {
        setToast({ msg: "Sesi login tidak dikenali. Silakan login ulang.", type: "error" });
        setTimeout(() => router.replace("/login"), 1500);
      } else if (res.status === 403) {
        setToast({ msg: "Akses ditolak: Hanya admin yang dapat mengakses", type: "error" });
      }
    } catch {
      setToast({ msg: "Gagal memuat daftar user", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.replace("/login");
      } else if (!isAdmin) {
        router.replace("/");
      } else {
        fetchUsers();
      }
    }
  }, [authLoading, currentUser, isAdmin, router, fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setToast({ msg: "Sesi login tidak dikenali. Silakan login ulang.", type: "error" });
          setTimeout(() => router.replace("/login"), 1500);
        } else {
          setToast({ msg: data.error || "Gagal menambah user", type: "error" });
        }
      } else {
        setToast({ msg: `User "${newUsername}" berhasil dibuat!`, type: "success" });
        setShowCreateModal(false);
        setNewUsername("");
        setNewName("");
        setNewPassword("");
        setNewRole("staff");
        fetchUsers();
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan jaringan", type: "error" });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEdit = (target: SafeUser) => {
    setEditingUser(target);
    setEditName(target.name);
    setEditRole(target.role);
    setEditPassword("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    try {
      const res = await apiFetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          password: editPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || "Gagal mengupdate user", type: "error" });
      } else {
        setToast({ msg: `User "${editingUser.username}" berhasil diupdate!`, type: "success" });
        setEditingUser(null);
        fetchUsers();
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan jaringan", type: "error" });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus user "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || "Gagal menghapus user", type: "error" });
      } else {
        setToast({ msg: "User berhasil dihapus", type: "success" });
        fetchUsers();
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan jaringan", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (loading && users.length === 0)) {
    return <Loading label="Memuat data pengguna..." />;
  }

  if (!isAdmin) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto my-12">
        <Lock className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Terbatas</h2>
        <p className="text-slate-600 text-sm mb-4">
          Halaman penambahan dan manajemen user hanya dapat diakses oleh Administrator.
        </p>
        <button onClick={() => router.push("/")} className="btn-primary inline-flex">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun dan hak akses pengguna sistem FO. Hanya Administrator yang dapat menambah dan mengatur user."
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah User Baru</span>
          </button>
        }
      />

      {/* Admin Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-amber-900">Hak Akses Khusus Administrator:</span>{" "}
          <span className="text-amber-800">
            Hanya user dengan role <strong>Admin</strong> yang berwenang membuat user baru atau mengubah role/password akun lain. User dengan role <strong>Staff</strong> hanya dapat melihat & menginput data infrastruktur FO.
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Daftar Pengguna Aktif ({users.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 uppercase text-xs tracking-wider">
                <th className="py-3 px-6">Pengguna</th>
                <th className="py-3 px-6">Username</th>
                <th className="py-3 px-6">Role / Akses</th>
                <th className="py-3 px-6">Terdaftar Sejak</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const isUserAdmin = u.role === "admin";
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isUserAdmin
                              ? "bg-purple-100 text-purple-700 ring-2 ring-purple-200"
                              : "bg-blue-100 text-blue-700 ring-2 ring-blue-200"
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-700 font-medium">
                      @{u.username}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isUserAdmin
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {isUserAdmin ? (
                          <>
                            <Shield className="h-3.5 w-3.5 text-purple-600" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                            Staff FO
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          disabled={isCurrent || deletingId === u.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isCurrent ? "Tidak dapat menghapus akun Anda sendiri" : "Hapus User"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !createSubmitting && setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-7 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah User Baru</h3>
                  <p className="text-xs text-slate-500">
                    Otorisasi Administrator untuk mendaftarkan akun baru
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="input-field w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: budi"
                  className="input-field w-full text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Username bebas — boleh huruf, angka, atau karakter apa pun.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password bebas"
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role / Hak Akses
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      newRole === "staff"
                        ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="staff"
                      checked={newRole === "staff"}
                      onChange={() => setNewRole("staff")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 text-sm block">Staff FO</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Dapat melihat & update data FO. Tidak bisa menambah user.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      newRole === "admin"
                        ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newRole === "admin"}
                      onChange={() => setNewRole("admin")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 text-sm block">Admin</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Akses penuh, termasuk penambahan & kelola pengguna.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {createSubmitting ? "Menyimpan..." : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !editSubmitting && setEditingUser(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-7 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit User</h3>
                  <p className="text-xs text-slate-500">
                    Username: <span className="font-mono font-medium">@{editingUser.username}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ganti Password (Opsional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Kosongkan bila tidak ingin mengubah password"
                  className="input-field w-full text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Isi hanya jika ingin memperbarui password user ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role / Hak Akses
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      editRole === "staff"
                        ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRole"
                      value="staff"
                      checked={editRole === "staff"}
                      onChange={() => setEditRole("staff")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 text-sm block">Staff FO</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Staff lapangan / operator
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      editRole === "admin"
                        ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRole"
                      value="admin"
                      checked={editRole === "admin"}
                      onChange={() => setEditRole("admin")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 text-sm block">Admin</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Administrator penuh
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editSubmitting}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {editSubmitting ? "Menyimpan..." : "Perbarui User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
