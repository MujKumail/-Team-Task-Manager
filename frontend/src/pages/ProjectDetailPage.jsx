import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";

import {
  addProjectMember,
  getProject,
  removeProjectMember,
} from "../api/projects";
import { createTask, deleteTask, getTasks, updateTask } from "../api/tasks";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const statuses = ["TODO", "IN_PROGRESS", "DONE"];

const statusLabels = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const statusStyles = {
  TODO: "bg-slate-100 text-slate-700 ring-slate-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-200",
  DONE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
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

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
      statusStyles[status] || statusStyles.TODO
    }`}
  >
    {statusLabels[status] || status}
  </span>
);

const RoleBadge = ({ role }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
      role === "ADMIN"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    {role}
  </span>
);

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    dueDate: "",
    status: "TODO",
  });
  const [memberForm, setMemberForm] = useState({
    email: "",
    role: "MEMBER",
  });

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });

  const taskParams = {
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(assigneeFilter !== "ALL" ? { assigneeId: assigneeFilter } : {}),
  };

  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId, taskParams],
    queryFn: () => getTasks(projectId, taskParams),
    enabled: Boolean(projectId),
  });

  const project = projectQuery.data?.data?.project;
  const members = project?.members || [];
  const tasks = tasksQuery.data?.data?.tasks || [];
  const myMembership = members.find((member) => member.userId === user?.id);
  const isAdmin = myMembership?.role === "ADMIN";

  const tasksByStatus = useMemo(() => {
    return statuses.reduce((groups, status) => {
      groups[status] = tasks.filter((task) => task.status === status);
      return groups;
    }, {});
  }, [tasks]);

  const invalidateProjectData = () => {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const addTaskMutation = useMutation({
    mutationFn: (payload) => createTask(projectId, payload),
    onSuccess: () => {
      invalidateProjectData();
      toast.success("Task added");
      setTaskForm({
        title: "",
        description: "",
        assigneeId: "",
        dueDate: "",
        status: "TODO",
      });
      setIsTaskModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Unable to add task");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload) => addProjectMember(projectId, payload),
    onSuccess: () => {
      invalidateProjectData();
      toast.success("Member added");
      setMemberForm({ email: "", role: "MEMBER" });
      setIsMemberModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Unable to add member");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => removeProjectMember(projectId, memberId),
    onSuccess: () => {
      invalidateProjectData();
      toast.success("Member removed");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Unable to remove member");
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => updateTask(projectId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task status updated");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to update task status"
      );
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(projectId, taskId),
    onSuccess: () => {
      invalidateProjectData();
      toast.success("Task deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Unable to delete task");
    },
  });

  const handleAddTask = (event) => {
    event.preventDefault();

    if (taskForm.title.trim().length < 2) {
      toast.error("Task title must be at least 2 characters");
      return;
    }

    addTaskMutation.mutate({
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      assigneeId: taskForm.assigneeId || null,
      dueDate: taskForm.dueDate ? `${taskForm.dueDate}T00:00:00.000Z` : null,
      status: taskForm.status,
    });
  };

  const handleAddMember = (event) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberForm.email)) {
      toast.error("Enter a valid email address");
      return;
    }

    addMemberMutation.mutate({
      email: memberForm.email.trim(),
      role: memberForm.role,
    });
  };

  const canUpdateTaskStatus = (task) => {
    return isAdmin || task.assigneeId === user?.id;
  };

  const handleStatusChange = (task, nextStatus) => {
    if (nextStatus === task.status) {
      return;
    }

    updateTaskStatusMutation.mutate({
      taskId: task.id,
      status: nextStatus,
    });
  };

  const handleDeleteTask = (taskId) => {
    const confirmed = window.confirm("Delete this task?");

    if (!confirmed) {
      return;
    }

    deleteTaskMutation.mutate(taskId);
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
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
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
        <Link
          to="/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to projects
        </Link>

        {projectQuery.isLoading ? (
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : projectQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {projectQuery.error?.response?.data?.message || "Unable to load project"}
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {project.name}
                  </h1>
                  {myMembership?.role && <RoleBadge role={myMembership.role} />}
                </div>
                <p className="mt-3 max-w-3xl text-slate-600">
                  {project.description}
                </p>
              </div>
              {isAdmin && activeTab === "tasks" && (
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus size={18} aria-hidden="true" />
                  Add Task
                </button>
              )}
              {isAdmin && activeTab === "members" && (
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <UserPlus size={18} aria-hidden="true" />
                  Add Member
                </button>
              )}
            </div>

            <div className="mb-6 flex border-b border-slate-200">
              {[
                ["tasks", "Tasks"],
                ["members", "Members"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold ${
                    activeTab === value
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-950"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "tasks" ? (
              <section className="space-y-5">
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ALL">All</option>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Assignee
                    </label>
                    <select
                      value={assigneeFilter}
                      onChange={(event) => setAssigneeFilter(event.target.value)}
                      className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ALL">All assignees</option>
                      {members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {tasksQuery.isLoading ? (
                  <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
                    <Loader2 className="animate-spin text-emerald-600" size={28} />
                  </div>
                ) : tasksQuery.isError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                    {tasksQuery.error?.response?.data?.message || "Unable to load tasks"}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {statuses.map((status) => (
                      <section
                        key={status}
                        className="min-h-80 rounded-lg border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                          <h2 className="font-semibold">{statusLabels[status]}</h2>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {tasksByStatus[status].length}
                          </span>
                        </div>
                        <div className="space-y-3 p-3">
                          {tasksByStatus[status].length > 0 ? (
                            tasksByStatus[status].map((task) => (
                              <article
                                key={task.id}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="font-medium text-slate-950">
                                    {task.title}
                                  </h3>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(task.id)}
                                      disabled={deleteTaskMutation.isPending}
                                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                      aria-label="Delete task"
                                    >
                                      <Trash2 size={16} aria-hidden="true" />
                                    </button>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                    {task.description}
                                  </p>
                                )}
                                <div className="mt-4">
                                  {canUpdateTaskStatus(task) ? (
                                    <select
                                      value={task.status}
                                      onChange={(event) =>
                                        handleStatusChange(task, event.target.value)
                                      }
                                      disabled={updateTaskStatusMutation.isPending}
                                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                                      aria-label="Update task status"
                                    >
                                      {statuses.map((nextStatus) => (
                                        <option key={nextStatus} value={nextStatus}>
                                          {statusLabels[nextStatus]}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <StatusBadge status={task.status} />
                                  )}
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                                      {getInitials(task.assignee?.name)}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                      {task.assignee?.name || "Unassigned"}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                                    <Calendar size={15} aria-hidden="true" />
                                    {formatDate(task.dueDate)}
                                  </span>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                              No tasks
                            </div>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                  <Users size={18} className="text-slate-500" aria-hidden="true" />
                  <h2 className="font-semibold">Members</h2>
                </div>
                <ul className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-950">
                          {member.user.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <RoleBadge role={member.role} />
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            disabled={removeMemberMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      <Modal
        isOpen={isTaskModalOpen}
        title="Add Task"
        onClose={() => setIsTaskModalOpen(false)}
      >
        <form className="space-y-5" onSubmit={handleAddTask}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="task-title">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Prepare release notes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="task-description">
              Description
            </label>
            <textarea
              id="task-description"
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="mt-2 block w-full resize-none rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Optional task details"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="task-assignee">
                Assignee
              </label>
              <select
                id="task-assignee"
                value={taskForm.assigneeId}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    assigneeId: event.target.value,
                  }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                value={taskForm.status}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, status: event.target.value }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="task-due-date">
              Due date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={taskForm.dueDate}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, dueDate: event.target.value }))
              }
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            type="submit"
            disabled={addTaskMutation.isPending}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {addTaskMutation.isPending ? "Adding..." : "Add Task"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isMemberModalOpen}
        title="Add Member"
        onClose={() => setIsMemberModalOpen(false)}
      >
        <form className="space-y-5" onSubmit={handleAddMember}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="member-email">
              Email
            </label>
            <input
              id="member-email"
              type="email"
              value={memberForm.email}
              onChange={(event) =>
                setMemberForm((current) => ({ ...current, email: event.target.value }))
              }
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="teammate@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="member-role">
              Role
            </label>
            <select
              id="member-role"
              value={memberForm.role}
              onChange={(event) =>
                setMemberForm((current) => ({ ...current, role: event.target.value }))
              }
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={addMemberMutation.isPending}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {addMemberMutation.isPending ? "Adding..." : "Add Member"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
