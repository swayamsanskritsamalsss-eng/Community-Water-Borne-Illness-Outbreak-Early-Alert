"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthGuard from "../../components/AuthGuard";
import Shell from "../../components/Shell";

import {
  getAdminSettings,
  getAdminUsers,
  getAuthorityDashboard,
  AdminUser,
  AuthorityDashboard,
  SystemSettings,
} from "../../lib/api";


function AdminDashboardContent() {

  const [
    users,
    setUsers,
  ] = useState<AdminUser[]>([]);


  const [
    dashboard,
    setDashboard,
  ] = useState<AuthorityDashboard | null>(
    null
  );


  const [
    settings,
    setSettings,
  ] = useState<SystemSettings | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {

    async function load() {

      try {

        const [
          usersData,
          dashboardData,
          settingsData,
        ] = await Promise.all([
          getAdminUsers(),
          getAuthorityDashboard(),
          getAdminSettings(),
        ]);

        setUsers(
          usersData
        );

        setDashboard(
          dashboardData
        );

        setSettings(
          settingsData
        );

      } finally {

        setLoading(false);
      }
    }

    load();

  }, []);


  if (loading) {

    return (
      <div className="page-container">

        <div className="py-20 text-center">

          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />

          <p className="text-sm text-slate-500">
            Loading admin dashboard...
          </p>

        </div>

      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="mb-6">

        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-water-600">
          Administration
        </p>

        <h2 className="text-2xl font-extrabold text-slate-900">
          System Dashboard
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage users, detection
          settings and system activity.
        </p>

      </div>


      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="card card-padding">

          <p className="text-sm text-slate-500">
            Users
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {users.length}
          </p>

        </div>


        <div className="card card-padding">

          <p className="text-sm text-slate-500">
            Total reports
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {dashboard?.stats.total_reports ||
              0}
          </p>

        </div>


        <div className="card card-padding">

          <p className="text-sm text-slate-500">
            Active alerts
          </p>

          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {dashboard?.stats.active_alerts ||
              0}
          </p>

        </div>


        <div className="card card-padding">

          <p className="text-sm text-slate-500">
            Cluster threshold
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {settings?.cluster_threshold ||
              3}
          </p>

        </div>

      </div>


      <div className="grid gap-6 lg:grid-cols-3">

        <div className="card card-padding">

          <div className="mb-4 text-3xl">
            👥
          </div>

          <h3 className="font-extrabold text-slate-900">
            User management
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create CHW, authority and
            administrator accounts and
            control account status.
          </p>

          <a
            href="/admin/users"
            className="btn-primary mt-5 w-full"
          >
            Manage users
          </a>

        </div>


        <div className="card card-padding">

          <div className="mb-4 text-3xl">
            ⚙️
          </div>

          <h3 className="font-extrabold text-slate-900">
            Detection settings
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Configure the demo threshold
            and time window used for
            possible-cluster detection.
          </p>

          <a
            href="/admin/settings"
            className="btn-primary mt-5 w-full"
          >
            Open settings
          </a>

        </div>


        <div className="card card-padding">

          <div className="mb-4 text-3xl">
            📊
          </div>

          <h3 className="font-extrabold text-slate-900">
            Monitoring
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View overall reports and
            current alert activity.
          </p>

          <a
            href="/authority"
            className="btn-secondary mt-5 w-full"
          >
            View monitoring
          </a>

        </div>

      </div>


      <section className="mt-6 card card-padding">

        <h3 className="section-title">
          Current configuration
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Threshold
            </p>

            <p className="mt-2 text-xl font-extrabold text-slate-900">
              {settings?.cluster_threshold}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              reports
            </p>

          </div>


          <div className="rounded-xl bg-slate-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Detection window
            </p>

            <p className="mt-2 text-xl font-extrabold text-slate-900">
              {settings?.window_hours}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              hours
            </p>

          </div>


          <div className="rounded-xl bg-slate-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Notifications
            </p>

            <p className="mt-2 text-xl font-extrabold text-slate-900">
              {settings?.notifications_enabled
                ? "Enabled"
                : "Disabled"}
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}


export default function AdminPage() {

  return (
    <AuthGuard
      allowedRoles={[
        "admin",
      ]}
    >

      <Shell
        title="Admin Dashboard"
      >
        <AdminDashboardContent />
      </Shell>

    </AuthGuard>
  );
}