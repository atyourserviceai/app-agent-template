import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface Project {
  name: string;
  displayName: string;
  isDefault?: boolean;
}

interface ProjectContextType {
  currentProject: Project;
  projects: Project[];
  switchProject: (projectName: string) => void;
  createProject: (displayName: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { authMethod } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project>({
    name: "personal",
    displayName: "Personal",
    isDefault: true,
  });
  const [projects, setProjects] = useState<Project[]>([
    { name: "personal", displayName: "Personal", isDefault: true },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const switchProject = useCallback(
    (projectName: string) => {
      const project = projects.find((p) => p.name === projectName);
      if (project) {
        setCurrentProject(project);
        localStorage.setItem("selectedProject", projectName);
      }
    },
    [projects]
  );

  const createProject = useCallback(
    async (displayName: string) => {
      if (!authMethod?.userInfo) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        // Convert display name to URL-safe name
        const projectName = displayName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/-+/g, "-") // Replace multiple hyphens with single
          .trim();

        if (!projectName) {
          throw new Error("Invalid project name");
        }

        // Check if project already exists
        if (projects.some((p) => p.name === projectName)) {
          throw new Error("Project already exists");
        }

        // Call UserDO to create the project via the base user agent (not project-specific)
        const userId = authMethod.userInfo.id;
        const response = await fetch(
          `/agents/app-agent/${userId}/create-project`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: authMethod.apiKey,
              projectName,
              displayName,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create project: ${error}`);
        }

        // Add to local state
        const newProject: Project = { name: projectName, displayName };
        setProjects((prev) => [...prev, newProject]);

        // Auto-switch to new project
        setCurrentProject(newProject);
        localStorage.setItem("selectedProject", projectName);
      } catch (error) {
        console.error("Failed to create project:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [authMethod, projects]
  );

  const loadProjects = useCallback(async () => {
    if (!authMethod?.userInfo) return;

    setIsLoading(true);
    try {
      // Get projects from the base user agent (not project-specific)
      const userId = authMethod.userInfo.id;
      const response = await fetch(
        `/agents/app-agent/${userId}/get-projects?token=${authMethod.apiKey}`
      );

      if (response.ok) {
        const userProjects = (await response.json()) as { projects?: any[] };

        // Extract projects array from API response
        const projectsArray = userProjects.projects || [];

        // Map API projects to frontend format, filtering out duplicates
        const apiProjects = Array.isArray(projectsArray)
          ? projectsArray
              .filter((p: any) => p.name !== "personal") // Don't duplicate personal
              .map((p: any) => ({
                name: p.name,
                displayName: p.display_name || p.name,
              }))
          : [];

        // Always include the default personal project first, then API projects
        const allProjects: Project[] = [
          { name: "personal", displayName: "Personal", isDefault: true },
          ...apiProjects,
        ];
        setProjects(allProjects);

        // Restore selected project from localStorage or default to personal
        const savedProject = localStorage.getItem("selectedProject");
        if (savedProject && allProjects.some((p) => p.name === savedProject)) {
          const project = allProjects.find((p) => p.name === savedProject)!;
          setCurrentProject(project);
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authMethod]);

  // Load projects when authenticated
  useEffect(() => {
    if (authMethod?.userInfo) {
      loadProjects();
    }
  }, [authMethod?.userInfo, loadProjects]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        switchProject,
        createProject,
        loadProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
