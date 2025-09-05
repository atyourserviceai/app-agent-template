import { useState, useId } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/button/Button";
import { Modal } from "@/components/modal/Modal";
import { Input } from "@/components/input/Input";

interface CreateProjectProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProject({ isOpen, onClose }: CreateProjectProps) {
  const { createProject } = useProject();
  const [newProjectName, setNewProjectName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const projectNameId = useId();

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
      onClose();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setNewProjectName("");
    setCreateError("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Create New Project</h2>
        <div>
          <label
            htmlFor={projectNameId}
            className="block text-sm font-medium mb-2"
          >
            Project Name
          </label>
          <Input
            id={projectNameId}
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
  );
}
