import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import {
  DropdownMenu,
  type MenuItemProps,
} from "@/components/dropdown/DropdownMenu";
import { Button } from "@/components/button/Button";
import { Modal } from "@/components/modal/Modal";
import { Input } from "@/components/input/Input";
import { Plus, FolderOpen, Check } from "@phosphor-icons/react";

interface ProjectSelectorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProjectSelector({
  className = "",
  size = "sm",
}: ProjectSelectorProps) {
  const { currentProject, projects, switchProject, createProject, isLoading } =
    useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setCreateError("Project name is required");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setShowCreateModal(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setNewProjectName("");
    setCreateError("");
  };

  const menuItems: MenuItemProps[] = [
    // Current projects
    ...projects.map((project) => ({
      type: "button" as const,
      label: (
        <div className="flex items-center justify-between w-full">
          <span>{project.displayName}</span>
          {currentProject.name === project.name && (
            <Check size={16} className="text-green-600" />
          )}
        </div>
      ),
      onClick: () => switchProject(project.name),
    })),
    // Separator
    { type: "divider" as const },
    // Create new project
    {
      type: "button" as const,
      label: (
        <div className="flex items-center gap-2 text-blue-600">
          <Plus size={16} />
          <span>Create New Project</span>
        </div>
      ),
      onClick: () => setShowCreateModal(true),
    },
  ];

  return (
    <>
      <DropdownMenu
        MenuItems={menuItems}
        align="start"
        side="bottom"
        sideOffset={8}
        disabled={isLoading}
        className={`flex items-center gap-2 ${className}`}
      >
        <FolderOpen size={16} />
        <span className="hidden sm:inline">{currentProject.displayName}</span>
        <span className="sm:hidden">Project</span>
      </DropdownMenu>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCancel}
        title="Create New Project"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium mb-2"
            >
              Project Name
            </label>
            <Input
              id="project-name"
              type="text"
              value={newProjectName}
              onValueChange={(value) => setNewProjectName(value)}
              placeholder="e.g., Marketing Ideas, Side Projects"
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreateProject();
                }
              }}
              autoFocus
            />
            {createError && (
              <p className="text-red-600 text-sm mt-1">{createError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !newProjectName.trim()}
              loading={isCreating}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
