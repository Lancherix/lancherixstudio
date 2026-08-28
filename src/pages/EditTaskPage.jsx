import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './Styles/NewProjectPage.css'; // puedes usar la misma CSS

const EditTaskPage = ({ isOpen, onClose, task, onUpdated }) => {
  const { t } = useTranslation();
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

      if (!res.ok) throw new Error(t('failedUpdateTask'));

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
          <h4>{t('editTask')}</h4>
        </div>

        {/* Content */}
        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>{t('name')}</label>
            <input
              type="text"
              placeholder={t('taskNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t('colDeadline')}</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-row form-row-a">
            <label>{t('priority')}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">{t('low')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="high">{t('high')}</option>
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
            {t('cancel')}
          </button>
          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default EditTaskPage;