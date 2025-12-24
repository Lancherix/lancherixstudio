import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Styles/ProjectPage.css";
import EditProjectPage from './EditProjectPage';
import EditTaskPage from './EditTaskPage';
import BoardTab from './BoardTab';

const ProjectPage = () => {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFolder, setActiveFolder] = useState("Tasks");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const editorRef = useRef(null);
  const [links, setLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const newTaskIndex = activeTasks.length;
  const [showOptions, setShowOptions] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

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
        document.title = data.name;
        setLinks(data.links || []);
      } catch (err) {
        setError(err.message);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  const FALLBACK =
    "https://studio.lancherix.com/Images/defaultProfilePicture.png";

  const getProfilePicture = (user) => {
    return user?.profilePicture?.url || FALLBACK;
  };

  useEffect(() => {
    const close = () => setShowOptions(false);
    if (showOptions) {
      window.addEventListener("click", close);
    }
    return () => window.removeEventListener("click", close);
  }, [showOptions]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!project?._id) return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/tasks/project/${project._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch tasks: ${res.status} ${text}`);
        }

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
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch note");

        const data = await res.json();
        setNoteContent(data.content || "");
      } catch (err) {
        console.error(err);
      }
    };

    fetchNote();
  }, [project?._id]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = noteContent;

      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [noteContent]);

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
        const text = await res.text();
        throw new Error(`Failed to create task: ${res.status} ${text}`);
      }

      const data = await res.json();
      setTasks((prev) => [...prev, data]);
      setNewTaskName("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete task: ${res.status} ${text}`);
      }

      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setSelectedTaskId(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

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
      console.error("Failed to save note", err);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      saveNote(noteContent);
    }, 1000);

    return () => clearTimeout(handler);
  }, [noteContent]);

  const handleNewLinkKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    let url = newLinkUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('.') || parsed.hostname.split('.').pop().length < 2) {
        throw new Error("Invalid domain");
      }
    } catch {
      alert("Please enter a valid URL");
      setNewLinkUrl("");
      return;
    }

    const updatedLinks = [...links, url];
    setLinks(updatedLinks);
    setNewLinkUrl("");

    // Guardar en backend
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
          body: JSON.stringify({ links: updatedLinks }),
        }
      );
    } catch (err) {
      console.error("Failed to update links", err);
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
          body: JSON.stringify({ links: updatedLinks }),
        }
      );
    } catch (err) {
      console.error("Failed to update links", err);
    }
  };

  /* ===== States ===== */
  if (loading) return <div className="loading-projectPage">Loading…</div>;
  if (error) return <div className="error-projectPage">{error}</div>;
  if (!project) return null;

  return (
    <div className="all-projectPage">
      <div className="window-projectPage">

        {/* ===== Sidebar ===== */}
        <aside className="menu-projectPage">

          {/* === Project Identity === */}
          <div className="projectHeader-projectPage">
            <div className="projectIcon-projectPage">
              {project.icon || "📁"}
            </div>
            <div className="projectDetails-projectPage">
              <div className="projectTitleRow">
                <p className="projectName-projectPage">{project.name}</p>
                {project.priority && (
                  <span className={`priority-dot priority-${project.priority.toLowerCase()}`} />
                )}
              </div>
              <p className="projectSlug-projectPage">{project.subject || project.slug}</p>
            </div>
          </div>

          {/* === Project Options === */}
          {(() => {
            const token = localStorage.getItem("token");
            if (!token) return null;

            let userId = null;
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              userId = payload.id; // aquí depende de cómo lo guardes en tu JWT
            } catch {
              return null;
            }

            const isOwner = project.owner?._id === userId;
            const isCollaborator = project.collaborators?.some(c => c._id === userId);

            if (!isOwner && !isCollaborator) return null;

            return (
              <div className="projectOptions-projectPage">
                <button
                  className="optionsButton-projectPage"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(prev => !prev);
                  }}
                >
                  ⋯
                </button>

                {showOptions && (
                  <div
                    className="optionsMenu-projectPage"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="optionsItem-projectPage"
                      onClick={() => {
                        setShowOptions(false);
                        setEditProjectOpen(true);
                      }}
                    >
                      Edit Project
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* === Project Metadata === */}
          <div className="metaSection-projectPage">
            {project.visibility && (
              <div className="visibility-projectPage">
                {project.visibility} project
              </div>
            )}
            {project.updatedAt && (
              <div className="visibility-projectPage">
                Updated: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            )}
            {project.createdAt && (
              <div className="visibility-projectPage">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* === Members (expanded) === */}
          {/* === Members Section === */}
          <div className="collaborators-projectPage">
            {(() => {
              const members = [];

              if (project.owner) {
                members.push({ ...project.owner, isOwner: true });
              }

              project.collaborators?.forEach(user => {
                if (user._id !== project.owner?._id) {
                  members.push(user);
                }
              });

              return (
                <>
                  <h4>{members.length} Members</h4>
                  <ul className="collaborators-expanded">
                    {members.map(user => (
                      <li key={user._id} className="collaborator-row">
                        <div
                          className={`avatar-projectPage ${user.isOwner ? "avatar-owner" : ""}`}
                          style={{ backgroundImage: `url(${getProfilePicture(user)})` }}
                        />
                        <div className="collaborator-info">
                          <span className="collaborator-name">{user.fullName}</span>
                          <span className="collaborator-username">{user.username}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>

        </aside>

        {/* ===== Main Content ===== */}
        <section className="content-projectPage">

          {/* 🔑 Main column (folders on top, content below) */}
          <div className="mainColumn-projectPage">

            {/* ===== Folder Tabs ===== */}
            <div className="foldersBar-projectPage">
              <div className="folders-projectPage">
                {["Tasks", "Notes", "Board"].map(folder => (
                  <button
                    key={folder}
                    className={`folderTab-projectPage ${activeFolder === folder ? "active-folder" : ""}`}
                    onClick={() => setActiveFolder(folder)}
                  >
                    {folder}
                  </button>
                ))}
              </div>
            </div>

            {/* ===== Work Area ===== */}
            <div className="workarea-projectPage" onClick={() => setSelectedTaskId(null)}>
              {activeFolder === "Tasks" && (
                <div className="tasks-projectPage">
                  {/* Column headers */}
                  <div className="tasks-header">
                    <div className="col-check" />
                    <div className="col-name">Name</div>
                    <div className="col-priority">Priority</div>
                    <div className="col-deadline">Due</div>
                  </div>
                  <div className="tasks-content">
                    {activeTasks.map((task, i) => (
                      <div
                        key={task._id}
                        className={`task-row ${i % 2 === 1 ? "row-alt" : ""} ${selectedTaskId === task._id ? "row-selected" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(task._id);
                        }}
                      >
                        <div className="col-check">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async () => {
                              try {
                                const token = localStorage.getItem("token");
                                const res = await fetch(
                                  `https://lancherixstudio-backend.onrender.com/api/tasks/${task._id}/complete`,
                                  { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
                                );
                                if (!res.ok) throw new Error("Failed to toggle task");

                                const updatedTask = await res.json();
                                setTasks((prev) =>
                                  prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                        </div>

                        <div className="col-name">{task.name}</div>

                        <div className="col-priority">
                          <span className={`priority-dot priority-${task.priority}`} />
                        </div>

                        <div className="col-deadline">
                          {task.due ? new Date(task.due).toLocaleDateString() : ""}
                        </div>

                        <div className="col-delete">
                          <button
                            className="edit-task-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToEdit(task);
                              setEditTaskOpen(true);
                            }}
                            aria-label="Edit Task"
                          >
                            ✎
                          </button>
                          <button
                            className="delete-task-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task._id);
                            }}
                            aria-label="Delete Task"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    <div
                      className={`task-row task-new ${newTaskIndex % 2 === 1 ? "row-alt" : ""}`}
                    >
                      <div className="col-check">
                        <input type="checkbox" disabled />
                      </div>

                      <div className="col-name">
                        <input
                          className="task-input"
                          placeholder="New Task"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={handleNewTaskKeyDown}
                        />
                      </div>

                      <div className="col-priority" />
                      <div className="col-deadline" />
                    </div>
                  </div>
                </div>
              )}

              {activeFolder === "Notes" && (
                <div className="notes-projectPage">
                  {/* ===== Toolbar / Panel de edición ===== */}
                  <div className="notes-toolbar">
                    <button onClick={() => applyFormat("undo")}>↺</button>
                    <button onClick={() => applyFormat("redo")}>↻</button>
                    <button onClick={() => applyFormat("bold")}><b>B</b></button>
                    <button onClick={() => applyFormat("italic")}><i>I</i></button>
                    <button onClick={() => applyFormat("underline")}><u>U</u></button>
                    <button onClick={() => applyFormat("strikeThrough")}><strike>S</strike></button>
                    <button onClick={() => applyFormat("formatBlock", "H1")}>Title</button>
                    <button onClick={() => applyFormat("formatBlock", "H2")}>Heading</button>
                    <button onClick={() => applyFormat("formatBlock", "H3")}>Subheading</button>
                    <button onClick={() => applyFormat("insertUnorderedList")}>• List</button>
                    <button onClick={() => applyFormat("insertOrderedList")}>1. List</button>
                  </div>

                  {/* ===== Contenedor editable ===== */}
                  <div
                    className="notes-editor"
                    ref={editorRef}
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: noteContent }}
                    onInput={(e) => setNoteContent(e.currentTarget.innerHTML)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text/plain");
                      document.execCommand("insertText", false, text);
                    }}
                    suppressContentEditableWarning={true}
                  />
                </div>
              )}

              {activeFolder === "Board" && (
                <BoardTab projectId={project._id} />
              )}
            </div>

          </div>

          {/* ===== Sources Panel ===== */}
          <aside className="content-projectPage-sources">


            <div className="sources-section">
              <h4>{links.length} Links</h4>
              <div className="links-list">
                <div className="links-content">
                  {links.map((link, i) => (
                    <div key={i} className={`link-row ${i % 2 === 1 ? "" : "row-alt"}`}>
                      <div className="col-name">
                        <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                      </div>
                      <div className="col-delete">
                        <button
                          className="delete-link-btn"
                          onClick={() => handleDeleteLink(i)}
                          aria-label="Delete Link"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input para nuevo link fuera de links-content */}
                <div className={`link-row row-alt`}>
                  <div className="col-name">
                    <input
                      className="link-input"
                      placeholder="New Link (Paste URL)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={handleNewLinkKeyDown}
                    />
                  </div>
                  <div className="col-delete" />
                </div>
              </div>
            </div>
            <div className="sources-divider" />
            <div className="sources-section">
              <h4>{completedTasks.length} Completed Tasks</h4>
              <div className="tasks-projectPage completed-tasks">
                {completedTasks.slice().reverse().map((task, i) => (
                  <div
                    key={task._id}
                    className={`task-row ${i % 2 === 1 ? "row-alt" : ""}`}
                  >
                    <div className="col-check">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={async () => {
                          try {
                            const token = localStorage.getItem("token");
                            const res = await fetch(
                              `https://lancherixstudio-backend.onrender.com/api/tasks/${task._id}/complete`,
                              { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
                            );
                            if (!res.ok) throw new Error("Failed to toggle task");

                            const updatedTask = await res.json();
                            setTasks(prev =>
                              prev.map(t => t._id === updatedTask._id ? updatedTask : t)
                            );
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      />
                    </div>

                    <div className="col-name">
                      {task.name}
                    </div>

                    {/* columnas vacías SOLO para mantener layout */}
                    <div className="col-priority" />
                    <div className="col-deadline" />

                    <div className="col-delete">
                      <button
                        className="delete-task-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task._id);
                        }}
                        aria-label="Delete Task"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
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
            prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
          );
        }}
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ProjectPage;