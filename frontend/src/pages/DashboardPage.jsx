import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getDashboard } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";

const statusStyles = {
  TODO: "bg-slate-100 text-slate-700 ring-slate-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-200",
  DONE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const statusLabels = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const formatDate = (date) => {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
      statusStyles[status] || statusStyles.TODO
    }`}
  >
    {statusLabels[status] || status}
  </span>
);

const StatCard = ({ title, value, icon: Icon, className }) => (
  <article className={`rounded-lg p-5 text-white shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
      </div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
        <Icon size={24} aria-hidden="true" />
      </div>
    </div>
  </article>
);

const TaskRow = ({ task, showDueDate = false }) => (
  <li className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="truncate font-medium text-slate-950">{task.title}</p>
      <p className="mt-1 text-sm text-slate-500">
        {task.project?.name || "No project"}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {showDueDate && (
        <span className="text-sm font-medium text-red-600">
          {formatDate(task.dueDate)}
        </span>
      )}
      <StatusBadge status={task.status} />
    </div>
  </li>
);

const EmptyState = ({ message }) => (
  <div className="px-5 py-10 text-center text-sm text-slate-500">{message}</div>
);

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const dashboard = data?.data;
  const tasksByStatus = dashboard?.tasksByStatus || {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ClipboardList size={22} aria-hidden="true" />
            </span>
            <span className="font-semibold">Team Task Manager</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/dashboard"
              className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              Projects
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
            <LayoutDashboard size={15} aria-hidden="true" />
            Dashboard
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-slate-600">
            A quick view of your assigned work and project activity.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2
              className="animate-spin text-emerald-600"
              size={32}
              aria-hidden="true"
            />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {error?.response?.data?.message || "Unable to load dashboard"}
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Projects"
                value={dashboard.totalProjects}
                icon={FolderKanban}
                className="bg-emerald-600"
              />
              <StatCard
                title="Total Tasks"
                value={dashboard.totalTasks}
                icon={ListChecks}
                className="bg-sky-600"
              />
              <StatCard
                title="In Progress"
                value={tasksByStatus.IN_PROGRESS}
                icon={Timer}
                className="bg-amber-600"
              />
              <StatCard
                title="Done"
                value={tasksByStatus.DONE}
                icon={CheckCircle2}
                className="bg-indigo-600"
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-semibold text-slate-950">
                    Overdue Tasks
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open tasks past their due date.
                  </p>
                </div>
                {dashboard.overdueTasks.length > 0 ? (
                  <ul>
                    {dashboard.overdueTasks.map((task) => (
                      <TaskRow key={task.id} task={task} showDueDate />
                    ))}
                  </ul>
                ) : (
                  <EmptyState message="No overdue tasks. Nicely under control." />
                )}
              </article>

              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-semibold text-slate-950">
                    Recent Tasks
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Last 5 tasks assigned to you.
                  </p>
                </div>
                {dashboard.recentTasks.length > 0 ? (
                  <ul>
                    {dashboard.recentTasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState message="No assigned tasks yet." />
                )}
              </article>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
