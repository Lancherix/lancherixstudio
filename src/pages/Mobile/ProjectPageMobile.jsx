import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProjectPageMobile.css";
import EditProjectPage from '../EditProjectPage';
import EditTaskPage from '../EditTaskPage';
import BoardTab from '../BoardTab';

const ProjectPageMobile = () => {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Tasks");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState("");
  const noteContentRef = useRef("");
  const editorRef = useRef(null);
  const [links, setLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const [showOptions, setShowOptions] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
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
          { headers: { Authorization: `Bearer ${token}` } }
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

  const FALLBACK = "https://studio.lancherix.com/Images/defaultProfilePicture.png";

  const getProfilePicture = (user) => user?.profilePicture?.url || FALLBACK;

  useEffect(() => {
    const close = () => setShowOptions(false);
    if (showOptions) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showOptions]);

  useEffect(() => {
    const close = () => setShowSidebar(false);
    if (showSidebar) {
      // slight delay so the toggle tap doesn't immediately close it
      const timer = setTimeout(() => window.addEventListener("click", close), 50);
      return () => { clearTimeout(timer); window.removeEventListener("click", close); };
    }
  }, [showSidebar]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!project?._id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/tasks/project/${project._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
        const data = await res.json();
        setTasks(data);
      } catch (err) { console.error(err); }
    };
    fetchTasks();
  }, [project?._id]);

  useEffect(() => {
    const fetchNote = async () => {
      if (!project?._id) return;
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/notes/project/${project._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const content = data.content || "";
      noteContentRef.current = content;
      if (editorRef.current) editorRef.current.innerHTML = content;
    };
    fetchNote();
  }, [project?._id]);

  const handleNewTaskKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    if (!newTaskName.trim() || !project?._id) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://lancherixstudio-backend.onrender.com/api/tasks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId: project._id, name: newTaskName.trim(), priority: "medium" }),
        }
      );
      if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
      const data = await res.json();
      setTasks(prev => [...prev, data]);
      setNewTaskName("");
    } catch (err) { console.error(err); alert(err.message); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${taskId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Failed to delete task: ${res.status}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setSelectedTaskId(null);
    } catch (err) { console.error(err); alert(err.message); }
  };

  const toggleTaskComplete = async (task) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${task._id}/complete`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to toggle task");
      const updatedTask = await res.json();
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    } catch (err) { console.error(err); }
  };

  const saveNote = async (content) => {
    if (!project?._id) return;
    try {
      const token = localStorage.getItem("token");
      await fetch("https://lancherixstudio-backend.onrender.com/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: project._id, content }),
      });
    } catch (err) { console.error("Failed to save note", err); }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!project?._id) return;
      saveNote(noteContentRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [project?._id]);

  useEffect(() => {
    if (activeTab === "Notes" && editorRef.current) {
      editorRef.current.innerHTML = noteContentRef.current || "";
    }
  }, [activeTab]);

  const handleNewLinkKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    let url = newLinkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('.') || parsed.hostname.split('.').pop().length < 2)
        throw new Error("Invalid domain");
    } catch {
      alert("Please enter a valid URL");
      setNewLinkUrl("");
      return;
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ links: updatedLinks }),
        }
      );
    } catch (err) { console.error("Failed to update links", err); }
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ links: updatedLinks }),
        }
      );
    } catch (err) { console.error("Failed to update links", err); }
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this project?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `https://lancherixstudio-backend.onrender.com/api/projects/${project._id}/leave`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = "/";
    } catch (err) { console.error(err); }
  };

  const handleShareProject = async () => {
    try {
      await navigator.clipboard.writeText(`https://studio.lancherix.com/projects/${project.slug}`);
      alert("Project link copied to clipboard!");
    } catch (err) { alert("Failed to copy project link"); }
  };

  const updateProjectStatus = async (newStatus) => {
    if (!project?._id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/projects/${project._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update project status");
      const updatedProject = await res.json();
      setProject(updatedProject);
      window.location.reload();
    } catch (err) { alert("Could not update project status"); }
  };

  const status = project ? project.status ?? "active" : "active";
  const isPinned = status === "pinned";
  const isHidden = status === "hidden";
  const isArchived = status === "archived";
  const isCompleted = status === "completed";

  // Resolve owner/collaborator info for options menu
  const getUserInfo = () => {
    const token = localStorage.getItem("token");
    if (!token) return { isOwner: false, isCollaborator: false };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const isOwner = project?.owner?._id === userId;
      const isCollaborator = project?.collaborators?.some(c => c._id === userId);
      return { isOwner, isCollaborator };
    } catch { return { isOwner: false, isCollaborator: false }; }
  };

  if (loading) return <div className="loading-mobile"> </div>;
  if (error) return <div className="error-mobile">{error}</div>;
  if (!project) return null;

  const { isOwner, isCollaborator } = getUserInfo();
  const canManage = isOwner || isCollaborator;

  const members = [];
  if (project.owner) members.push({ ...project.owner, isOwner: true });
  project.collaborators?.forEach(u => {
    if (u._id !== project.owner?._id) members.push(u);
  });

  return (
    <div className="mobile-projectPage">

      {/* ===== Top Header Bar ===== */}
      <header className="mobile-header">
        <div className="mobile-header-identity">
          <span className="mobile-header-icon">{project.icon || "📁"}</span>
          <div className="mobile-header-text">
            <div className="mobile-header-title-row">
              <span className="mobile-header-name">{project.name}</span>
              {project.priority && (
                <span className={`priority-dot priority-${project.priority.toLowerCase()}`} />
              )}
            </div>
            <span className="mobile-header-sub">{project.subject || project.slug}</span>
          </div>
        </div>

        <div className="mobile-header-actions">
          {/* Members drawer toggle */}
          <button
            className="mobile-icon-btn"
            onClick={(e) => { e.stopPropagation(); setShowSidebar(prev => !prev); }}
            aria-label="Members"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </button>

          {/* Options menu */}
          {canManage && (
            <div className="mobile-options-wrap" onClick={e => e.stopPropagation()}>
              <button
                className="mobile-icon-btn"
                onClick={(e) => { e.stopPropagation(); setShowOptions(prev => !prev); }}
                aria-label="Options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>

              {showOptions && (
                <div className="mobile-options-menu">
                  <button className="mobile-options-item" onClick={() => { setShowOptions(false); setEditProjectOpen(true); }}>Edit Details</button>
                  <button className="mobile-options-item" onClick={() => { setShowOptions(false); updateProjectStatus(isPinned ? "active" : "pinned"); }}>{isPinned ? "Unpin Project" : "Pin Project"}</button>
                  <button className="mobile-options-item" onClick={() => { setShowOptions(false); updateProjectStatus(isHidden ? "active" : "hidden"); }}>{isHidden ? "Unhide" : "Hide"}</button>
                  {!isCompleted && <button className="mobile-options-item" onClick={() => { setShowOptions(false); updateProjectStatus("completed"); }}>Mark as Completed</button>}
                  {project.visibility === "public" && <button className="mobile-options-item" onClick={() => { setShowOptions(false); handleShareProject(); }}>Share</button>}
                  <button className="mobile-options-item" onClick={() => { setShowOptions(false); updateProjectStatus(isArchived ? "active" : "archived"); }}>{isArchived ? "Restore Project" : "Archive Project"}</button>
                  <div className="mobile-options-divider" />
                  <button className="mobile-options-item danger" onClick={() => { setShowOptions(false); handleLeave(); }}>Leave Project</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ===== Members Drawer ===== */}
      {showSidebar && (
        <div className="mobile-drawer-overlay" onClick={() => setShowSidebar(false)}>
          <aside className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h3>{members.length} Members</h3>
              <button className="mobile-drawer-close" onClick={() => setShowSidebar(false)}>✕</button>
            </div>
            <ul className="mobile-members-list">
              {members.map(user => (
                <li key={user._id} className="mobile-member-row">
                  <div
                    className={`mobile-avatar ${user.isOwner ? "avatar-owner" : ""}`}
                    style={{ backgroundImage: `url(${getProfilePicture(user)})` }}
                  />
                  <div className="mobile-member-info">
                    <span className="mobile-member-name">{user.firstName} {user.lastName}</span>
                    <span className="mobile-member-username">@{user.username}</span>
                  </div>
                  {user.isOwner && <span className="mobile-owner-badge">Owner</span>}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      {/* ===== Tab Bar ===== */}
      <nav className="mobile-tab-bar">
        {["Tasks", "Notes", "Board", "Links", "Done"].map(tab => (
          <button
            key={tab}
            className={`mobile-tab ${activeTab === tab ? "mobile-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Tasks" && activeTasks.length > 0 && (
              <span className="mobile-tab-badge">{activeTasks.length}</span>
            )}
            {tab === "Done" && completedTasks.length > 0 && (
              <span className="mobile-tab-badge done-badge">{completedTasks.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ===== Main Content Area ===== */}
      <main className="mobile-content" onClick={() => setSelectedTaskId(null)}>

        {/* ===== Tasks Tab ===== */}
        {activeTab === "Tasks" && (
          <div className="mobile-tasks">
            <div className="mobile-tasks-list">
              {activeTasks.length === 0 && (
                <p className="mobile-empty-state">No tasks yet. Add one below ↓</p>
              )}
              {activeTasks.map((task) => (
                <div
                  key={task._id}
                  className={`mobile-task-card ${selectedTaskId === task._id ? "mobile-task-selected" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task._id); }}
                >
                  <div className="mobile-task-left">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleTaskComplete(task)}
                      className="mobile-checkbox"
                    />
                    <div className="mobile-task-details">
                      <span className="mobile-task-name">{task.name}</span>
                      {task.due && (
                        <span className="mobile-task-due">
                          Due {new Date(task.due).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mobile-task-right">
                    <span className={`priority-dot priority-${task.priority}`} />
                    <button
                      className="mobile-edit-btn"
                      onClick={(e) => { e.stopPropagation(); setTaskToEdit(task); setEditTaskOpen(true); }}
                      aria-label="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 0 0-3.471 2.987 10.04 10.04 0 0 1 4.815 4.815 18.748 18.748 0 0 0 2.987-3.472l3.386-5.079A1.902 1.902 0 0 0 20.599 1.5Zm-8.3 14.025a18.76 18.76 0 0 0 1.896-1.207 8.026 8.026 0 0 0-4.513-4.513A18.75 18.75 0 0 0 8.475 11.7l-.278.5a5.26 5.26 0 0 1 3.601 3.602l.502-.278ZM6.75 13.5A3.75 3.75 0 0 0 3 17.25a1.5 1.5 0 0 1-1.601 1.497.75.75 0 0 0-.7 1.123 5.25 5.25 0 0 0 9.8-2.62 3.75 3.75 0 0 0-3.75-3.75Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="mobile-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                      aria-label="Delete"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* New Task Input */}
            <div className="mobile-new-task">
              <span className="mobile-new-task-icon">+</span>
              <input
                className="mobile-new-task-input"
                placeholder="New Task — press Enter to add"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={handleNewTaskKeyDown}
              />
            </div>
          </div>
        )}

        {/* ===== Notes Tab ===== */}
        {activeTab === "Notes" && (
          <div className="mobile-notes">
            <div className="mobile-notes-toolbar">
              <button onClick={() => applyFormat("undo")}>↺</button>
              <button onClick={() => applyFormat("redo")}>↻</button>
              <button onClick={() => applyFormat("bold")}><b>B</b></button>
              <button onClick={() => applyFormat("italic")}><i>I</i></button>
              <button onClick={() => applyFormat("underline")}><u>U</u></button>
              <button onClick={() => applyFormat("strikeThrough")}><s>S</s></button>
              <button onClick={() => applyFormat("formatBlock", "H1")}>H1</button>
              <button onClick={() => applyFormat("formatBlock", "H2")}>H2</button>
              <button onClick={() => applyFormat("insertUnorderedList")}>• List</button>
              <button onClick={() => applyFormat("insertOrderedList")}>1. List</button>
            </div>
            <div
              className="mobile-notes-editor"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => { noteContentRef.current = editorRef.current.innerHTML; }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text/plain");
                document.execCommand("insertText", false, text);
              }}
            />
          </div>
        )}

        {/* ===== Board Tab ===== */}
        {activeTab === "Board" && (
          <div className="mobile-board">
            <BoardTab projectId={project._id} />
          </div>
        )}

        {/* ===== Links Tab ===== */}
        {activeTab === "Links" && (
          <div className="mobile-links">
            <div className="mobile-links-list">
              {links.length === 0 && (
                <p className="mobile-empty-state">No links yet. Paste one below ↓</p>
              )}
              {links.map((link, i) => (
                <div key={i} className="mobile-link-card">
                  <div className="mobile-link-favicon">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${link}&sz=32`}
                      alt=""
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <a
                    className="mobile-link-url"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >{link}</a>
                  <button
                    className="mobile-delete-btn"
                    onClick={() => handleDeleteLink(i)}
                    aria-label="Delete Link"
                  >✕</button>
                </div>
              ))}
            </div>
            <div className="mobile-new-task">
              <span className="mobile-new-task-icon">🔗</span>
              <input
                className="mobile-new-task-input"
                placeholder="Paste URL — press Enter to add"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                onKeyDown={handleNewLinkKeyDown}
              />
            </div>
          </div>
        )}

        {/* ===== Done Tab ===== */}
        {activeTab === "Done" && (
          <div className="mobile-tasks">
            <div className="mobile-tasks-list">
              {completedTasks.length === 0 && (
                <p className="mobile-empty-state">No completed tasks yet.</p>
              )}
              {completedTasks.slice().reverse().map((task) => (
                <div key={task._id} className="mobile-task-card mobile-task-done">
                  <div className="mobile-task-left">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task)}
                      className="mobile-checkbox"
                    />
                    <span className="mobile-task-name mobile-task-name-done">{task.name}</span>
                  </div>
                  <div className="mobile-task-right">
                    <button
                      className="mobile-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                      aria-label="Delete"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ===== Modals ===== */}
      <EditProjectPage
        isOpen={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onUpdated={(updatedProject) => setProject(updatedProject)}
      />
      <EditTaskPage
        isOpen={editTaskOpen}
        onClose={() => { setEditTaskOpen(false); setTaskToEdit(null); }}
        task={taskToEdit}
        onUpdated={(updatedTask) => {
          setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        }}
      />
    </div>
  );
};

export default ProjectPageMobile;