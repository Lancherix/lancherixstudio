import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Styles/NewProjectPage.css'; // puedes usar la misma CSS

const EditTaskPage = ({ isOpen, onClose, task, onUpdated }) => {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cuando cambia la task, cargar los valores en el modal
  useEffect(() => {
    if (task) {
      setName(task.name || "");
      setPriority(task.priority || "medium");
      setDeadline(task.due ? new Date(task.due).toISOString().slice(0, 16) : "");
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/tasks/${task._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            priority,
            due: deadline || null,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update task");

      const updatedTask = await res.json();
      onUpdated(updatedTask);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return createPortal(
    <div className="new-project-overlay">
      <div
        className="new-project-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="new-project-header">
          <h4>Edit Task</h4>
        </div>

        {/* Content */}
        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>Name</label>
            <input
              type="text"
              placeholder="Task Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-row form-row-a">
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="new-project-footer">
          <button
            className="secondary-btn"
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default EditTaskPage;