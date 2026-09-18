"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AuthGuard from "../../../components/AuthGuard";
import Shell from "../../../components/Shell";

import {
  AdminUser,
  createAdminUser,
  getAdminUsers,
  getVillages,
  updateAdminUser,
  Village,
} from "../../../lib/api";


const ROLES = ["chw", "authority", "admin"];


function UsersContent() {

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  // Create-user form state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("chw");
  const [villageId, setVillageId] = useState("");
  const [region, setRegion] = useState("");

  // Row being toggled
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function load() {
    try {
      setError("");
      const [usersData, villageData] = await Promise.all([
        getAdminUsers(),
        getVillages(),
      ]);
      setUsers(usersData);
      setVillages(villageData);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load users. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setActionError("");
    setSuccess("");
    setCreating(true);

    try {
      await createAdminUser({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        village_id: villageId || undefined,
        region: region.trim() || undefined,
      });

      setSuccess(`User ${email.trim()} created.`);
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("chw");
      setVillageId("");
      setRegion("");
      setShowCreate(false);
      await load();
    } catch (err: any) {
      setActionError(
        err?.message || "Unable to create user."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    setActionError("");
    setSuccess("");
    setBusyUserId(user.id);

    try {
      await updateAdminUser(user.id, {
        is_active: !user.is_active,
      });
      setSuccess(
        `${user.email} is now ${!user.is_active ? "active" : "disabled"}.`
      );
      await load();
    } catch (err: any) {
      setActionError(
        err?.message || "Unable to update user."
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRoleChange(
    user: AdminUser,
    newRole: string
  ) {
    if (newRole === user.role) return;
    setActionError("");
    setSuccess("");
    setBusyUserId(user.id);

    try {
      await updateAdminUser(user.id, { role: newRole });
      setSuccess(`${user.email} role updated to ${newRole}.`);
      await load();
    } catch (err: any) {
      setActionError(
        err?.message || "Unable to update user."
      );
      await load();
    } finally {
      setBusyUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />
          <p className="text-sm text-slate-500">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            User management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create accounts, change roles and
            enable or disable access.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Close form" : "+ New user"}
        </button>
      </div>

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {actionError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {showCreate && (
        <section className="card card-padding mb-6">
          <h3 className="section-title">Create a new user</h3>

          <form
            onSubmit={handleCreate}
            className="mt-5 grid gap-5 sm:grid-cols-2"
          >
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Password (min 6 chars)
              </label>
              <input
                className="form-input"
                type="text"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Role</label>
              <select
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Village (optional)
              </label>
              <select
                className="form-input"
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
              >
                <option value="">No village</option>
                {villages.map((village) => (
                  <option key={village.id} value={village.id}>
                    {village.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Region (optional)
              </label>
              <input
                className="form-input"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="btn-primary w-full py-3"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create user"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="section-title">
            All users ({users.length})
          </h3>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Village</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-semibold">
                    {user.full_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={user.role}
                      disabled={busyUserId === user.id}
                      onChange={(e) =>
                        handleRoleChange(user, e.target.value)
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.village_name || "—"}</td>
                  <td>
                    <span
                      className={`badge ${
                        user.is_active
                          ? "badge-green"
                          : "badge-gray"
                      }`}
                    >
                      {user.is_active ? "active" : "disabled"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={
                        user.is_active
                          ? "btn-danger"
                          : "btn-secondary"
                      }
                      disabled={busyUserId === user.id}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <Shell title="User Management">
        <UsersContent />
      </Shell>
    </AuthGuard>
  );
}
