import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  FolderKanban,
  Loader2,
  LogOut,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import { createProject, getProjects } from "../api/projects";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setFormData({ name: "", description: "" });
      setIsModalOpen(false);
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || "Unable to create project");
    },
  });

  const projects = data?.data?.projects || [];

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.name.trim().length < 2) {
      toast.error("Project name must be at least 2 characters");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Project description is required");
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
              <FolderKanban size={15} aria-hidden="true" />
              Projects
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Your projects
            </h1>
            <p className="mt-2 text-slate-600">
              Browse team workspaces and open the project board.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus size={18} aria-hidden="true" />
            New Project
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {error?.response?.data?.message || "Unable to load projects"}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <FolderKanban className="mx-auto text-slate-400" size={40} />
            <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create your first project to start assigning work.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950">
                      {project.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {project.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {project.myRole}
                  </span>
                </div>
                <div className="mt-6 flex items-center gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={16} aria-hidden="true" />
                    {project._count?.members || 0} members
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList size={16} aria-hidden="true" />
                    {project._count?.tasks || 0} tasks
                  </span>
                </div>
              </button>
            ))}
          </section>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        title="New Project"
        onClose={() => setIsModalOpen(false)}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="project-name">
              Name
            </label>
            <input
              id="project-name"
              type="text"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Website launch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 block w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="What this project is responsible for"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
