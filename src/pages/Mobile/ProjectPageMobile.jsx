import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import "./ProjectPageMobile.css";

import EditProjectPage from "./EditProjectPage";
import EditTaskPage from "./EditTaskPage";
import BoardTab from "./BoardTab";

const ProjectPageMobile = () => {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeFolder, setActiveFolder] = useState("Tasks");
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");

  const [links, setLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [showOptions, setShowOptions] = useState(false);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const noteContentRef = useRef("");
  const editorRef = useRef(null);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const FALLBACK =
    "https://studio.lancherix.com/Images/defaultProfilePicture.png";

  const getProfilePicture = (user) => {
    return user?.profilePicture?.url || FALLBACK;
  };

  /* =========================================================
      FETCH PROJECT
  ========================================================= */

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Not authenticated");
        }

        const res = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/projects/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "This project does not exist"
              : data.error || "Failed to load project"
          );
        }

        setProject(data);
        setLinks(data.links || []);

        document.title = data.name;
      } catch (err) {
        setError(err.message);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  /* =========================================================
      FETCH TASKS
  ========================================================= */

  useEffect(() => {
    const fetchTasks = async () => {
      if (!project?._id) return;

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/tasks/project/${project._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await res.json();

        setTasks(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTasks();
  }, [project?._id]);

  /* =========================================================
      FETCH NOTES
  ========================================================= */

  useEffect(() => {
    const fetchNote = async () => {
      if (!project?._id) return;

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/notes/project/${project._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        const content = data.content || "";

        noteContentRef.current = content;

        if (editorRef.current) {
          editorRef.current.innerHTML = content;
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchNote();
  }, [project?._id]);

  /* =========================================================
      SAVE NOTES
  ========================================================= */

  const saveNote = async (content) => {
    if (!project?._id) return;

    try {
      const token = localStorage.getItem("token");

      await fetch(
        "https://lancherixstudio-backend.onrender.com/api/notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: project._id,
            content,
          }),
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!project?._id) return;

      saveNote(noteContentRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [project?._id]);

  /* =========================================================
      TASKS
  ========================================================= */

  const handleNewTaskKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    if (!newTaskName.trim() || !project?._id) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "https://lancherixstudio-backend.onrender.com/api/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: project._id,
            name: newTaskName.trim(),
            priority: "medium",
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      const data = await res.json();

      setTasks((prev) => [...prev, data]);

      setNewTaskName("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (task) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${task._id}/complete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to toggle task");
      }

      const updatedTask = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete task?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================================
      LINKS
  ========================================================= */

  const handleNewLinkKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    let url = newLinkUrl.trim();

    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const updatedLinks = [...links, url];

    setLinks(updatedLinks);

    setNewLinkUrl("");

    try {
      const token = localStorage.getItem("token");

      await fetch(
        `https://lancherixstudio-backend.onrender.com/api/projects/${project._id}/links`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            links: updatedLinks,
          }),
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);

    setLinks(updatedLinks);

    try {
      const token = localStorage.getItem("token");

      await fetch(
        `https://lancherixstudio-backend.onrender.com/api/projects/${project._id}/links`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            links: updatedLinks,
          }),
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================================
      TEXT FORMAT
  ========================================================= */

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  /* =========================================================
      STATES
  ========================================================= */

  if (loading) {
    return <div className="loading-projectPageMobile"></div>;
  }

  if (error) {
    return (
      <div className="error-projectPageMobile">
        {error}
      </div>
    );
  }

  if (!project) return null;

  /* =========================================================
      RENDER
  ========================================================= */

  return (
    <div className="all-projectPageMobile">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="header-projectPageMobile">

        <div className="headerLeft-projectPageMobile">

          <div className="projectIcon-projectPageMobile">
            {project.icon || "📁"}
          </div>

          <div className="projectInfo-projectPageMobile">

            <div className="projectName-projectPageMobile">
              {project.name}
            </div>

            <button
              className="folderSelector-projectPageMobile"
              onClick={() =>
                setFolderMenuOpen((prev) => !prev)
              }
            >
              {activeFolder}
              <span className="folderArrow-projectPageMobile">
                ▼
              </span>
            </button>

          </div>

        </div>

        <button
          className="optionsButton-projectPageMobile"
          onClick={() =>
            setShowOptions((prev) => !prev)
          }
        >
          ⋯
        </button>

      </header>

      {/* =====================================================
          FOLDER MENU
      ===================================================== */}

      {folderMenuOpen && (
        <div className="folderMenu-projectPageMobile">

          {["Tasks", "Notes", "Board", "Links"].map((folder) => (
            <button
              key={folder}
              className={`folderMenuItem-projectPageMobile ${
                activeFolder === folder
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setActiveFolder(folder);
                setFolderMenuOpen(false);
              }}
            >
              {folder}
            </button>
          ))}

        </div>
      )}

      {/* =====================================================
          CONTENT BOX
      ===================================================== */}

      <div className="contentBox-projectPageMobile">

        {/* =================================================
            TASKS
        ================================================= */}

        {activeFolder === "Tasks" && (
          <div className="tasks-projectPageMobile">

            {activeTasks.map((task) => (
              <div
                key={task._id}
                className={`taskCard-projectPageMobile ${
                  selectedTaskId === task._id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedTaskId(task._id)
                }
              >

                <div className="taskTop-projectPageMobile">

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="taskName-projectPageMobile">
                    {task.name}
                  </div>

                </div>

                <div className="taskBottom-projectPageMobile">

                  <div className="taskPriority-projectPageMobile">
                    {task.priority}
                  </div>

                  {task.due && (
                    <div className="taskDue-projectPageMobile">
                      {new Date(task.due).toLocaleDateString()}
                    </div>
                  )}

                </div>

                <div className="taskActions-projectPageMobile">

                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      setTaskToEdit(task);
                      setEditTaskOpen(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task._id);
                    }}
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))}

            <input
              className="newTaskInput-projectPageMobile"
              placeholder="New Task"
              value={newTaskName}
              onChange={(e) =>
                setNewTaskName(e.target.value)
              }
              onKeyDown={handleNewTaskKeyDown}
            />

          </div>
        )}

        {/* =================================================
            NOTES
        ================================================= */}

        {activeFolder === "Notes" && (
          <div className="notes-projectPageMobile">

            <div className="notesToolbar-projectPageMobile">

              <button onClick={() => applyFormat("bold")}>
                B
              </button>

              <button onClick={() => applyFormat("italic")}>
                I
              </button>

              <button onClick={() => applyFormat("underline")}>
                U
              </button>

              <button
                onClick={() =>
                  applyFormat("insertUnorderedList")
                }
              >
                • List
              </button>

            </div>

            <div
              className="notesEditor-projectPageMobile"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                noteContentRef.current =
                  editorRef.current.innerHTML;
              }}
            />

          </div>
        )}

        {/* =================================================
            BOARD
        ================================================= */}

        {activeFolder === "Board" && (
          <div className="board-projectPageMobile">
            <BoardTab projectId={project._id} />
          </div>
        )}

        {/* =================================================
            LINKS
        ================================================= */}

        {activeFolder === "Links" && (
          <div className="links-projectPageMobile">

            {links.map((link, i) => (
              <div
                key={i}
                className="linkCard-projectPageMobile"
              >

                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link}
                </a>

                <button
                  onClick={() =>
                    handleDeleteLink(i)
                  }
                >
                  ✕
                </button>

              </div>
            ))}

            <input
              className="newLinkInput-projectPageMobile"
              placeholder="New Link"
              value={newLinkUrl}
              onChange={(e) =>
                setNewLinkUrl(e.target.value)
              }
              onKeyDown={handleNewLinkKeyDown}
            />

          </div>
        )}

      </div>

      {/* =====================================================
          MODALS
      ===================================================== */}

      <EditProjectPage
        isOpen={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onUpdated={(updatedProject) => {
          setProject(updatedProject);
        }}
      />

      <EditTaskPage
        isOpen={editTaskOpen}
        onClose={() => {
          setEditTaskOpen(false);
          setTaskToEdit(null);
        }}
        task={taskToEdit}
        onUpdated={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) =>
              t._id === updatedTask._id
                ? updatedTask
                : t
            )
          );
        }}
      />

    </div>
  );
};

export default ProjectPageMobile;