import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./Styles/ProjectPageMobile.css";

const ProjectPageMobile = () => {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeFolder, setActiveFolder] = useState("Tasks");
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState("");

  const [links, setLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const editorRef = useRef(null);
  const noteContentRef = useRef("");

  const folders = ["Tasks", "Notes", "Links", "Completed"];

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("token");

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
          throw new Error(data.error || "Failed to load project");
        }

        setProject(data);
        setLinks(data.links || []);
        document.title = data.name;
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

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

        const data = await res.json();

        setTasks(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTasks();
  }, [project?._id]);

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

        noteContentRef.current = data.content || "";

        if (editorRef.current) {
          editorRef.current.innerHTML = noteContentRef.current;
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchNote();
  }, [project?._id]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveNote(noteContentRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [project?._id]);

  const saveNote = async (content) => {
    if (!project?._id) return;

    try {
      const token = localStorage.getItem("token");

      await fetch("https://lancherixstudio-backend.onrender.com/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project._id,
          content,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewTaskKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    if (!newTaskName.trim()) return;

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

      const data = await res.json();

      setTasks((prev) => [...prev, data]);
      setNewTaskName("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${taskId}/complete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedTask = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

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

  if (loading) {
    return <div className="loading-projectPageMobile"></div>;
  }

  if (error) {
    return <div className="error-projectPageMobile">{error}</div>;
  }

  if (!project) return null;

  return (
    <div className="all-projectPageMobile">
      {/* ===== Top Bar ===== */}
      <div className="mobileHeader-projectPageMobile">
        <div className="mobileProjectInfo-projectPageMobile">
          <div className="mobileProjectIcon-projectPageMobile">
            {project.icon || "📁"}
          </div>

          <div className="mobileProjectText-projectPageMobile">
            <div className="mobileProjectName-projectPageMobile">
              {project.name}
            </div>

            <button
              className="mobileFolderSwitcher-projectPageMobile"
              onClick={() => setShowFolderMenu((prev) => !prev)}
            >
              {activeFolder} ▼
            </button>

            {showFolderMenu && (
              <div className="mobileFolderMenu-projectPageMobile">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    className="mobileFolderItem-projectPageMobile"
                    onClick={() => {
                      setActiveFolder(folder);
                      setShowFolderMenu(false);
                    }}
                  >
                    {folder}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="mobileContent-projectPageMobile">
        {activeFolder === "Tasks" && (
          <div className="mobileTasks-projectPageMobile">
            {activeTasks.map((task) => (
              <div
                key={task._id}
                className={`mobileTaskRow-projectPageMobile ${
                  selectedTaskId === task._id ? "selected" : ""
                }`}
                onClick={() => setSelectedTaskId(task._id)}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task._id)}
                />

                <div className="mobileTaskName-projectPageMobile">
                  {task.name}
                </div>

                <button
                  className="mobileDelete-projectPageMobile"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task._id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <input
              className="mobileTaskInput-projectPageMobile"
              placeholder="New Task"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={handleNewTaskKeyDown}
            />
          </div>
        )}

        {activeFolder === "Notes" && (
          <div className="mobileNotes-projectPageMobile">
            <div
              className="mobileEditor-projectPageMobile"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                noteContentRef.current = editorRef.current.innerHTML;
              }}
            />
          </div>
        )}

        {activeFolder === "Links" && (
          <div className="mobileLinks-projectPageMobile">
            {links.map((link, i) => (
              <div
                key={i}
                className="mobileLinkRow-projectPageMobile"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link}
                </a>

                <button
                  className="mobileDelete-projectPageMobile"
                  onClick={() => handleDeleteLink(i)}
                >
                  ✕
                </button>
              </div>
            ))}

            <input
              className="mobileLinkInput-projectPageMobile"
              placeholder="New Link"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={handleNewLinkKeyDown}
            />
          </div>
        )}

        {activeFolder === "Completed" && (
          <div className="mobileTasks-projectPageMobile">
            {completedTasks
              .slice()
              .reverse()
              .map((task) => (
                <div
                  key={task._id}
                  className="mobileTaskRow-projectPageMobile completed"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task._id)}
                  />

                  <div className="mobileTaskName-projectPageMobile">
                    {task.name}
                  </div>

                  <button
                    className="mobileDelete-projectPageMobile"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPageMobile;