import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import {
  DropdownMenu,
  type MenuItemProps
} from "@/components/dropdown/DropdownMenu";
import { CreateProject } from "./CreateProject";
import { Plus, FolderOpen, Check } from "@phosphor-icons/react";

interface ProjectSelectorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProjectSelector({ className = "" }: ProjectSelectorProps) {
  const { currentProject, projects, switchProject, isLoading } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      onClick: () => switchProject(project.name)
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
      onClick: () => setShowCreateModal(true)
    }
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
      <CreateProject
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
