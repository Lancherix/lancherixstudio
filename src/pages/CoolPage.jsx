/*import React, { useState, useEffect, useRef } from 'react';
import './Styles/CoolPage.css';

import AddIcon from '../icons/add.svg';
import ListIcon from '../icons/list.svg';
import NumberListIcon from '../icons/numberlist.svg';
import CheckListIcon from '../icons/checklist.svg';
import AlignLeftIcon from '../icons/alignleft.svg';
import AlignCenterIcon from '../icons/aligncenter.svg';
import AlignRightIcon from '../icons/alignright.svg';
import AlignJustifyIcon from '../icons/alignjustify.svg';

const CoolPage = () => {
  document.title = 'Lancherix Notes';

  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('16px');
  const [fontColor, setFontColor] = useState('#000000');
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState(null);
  const [currentNote, setCurrentNote] = useState('');
  const [isNewNote, setIsNewNote] = useState(true);
  const editorRef = useRef(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (note) {
      setCurrentNote(note.content);
  
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = note.content;
        }
      }, 0);
    }
  });

  const applyStyle = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleFontFamilyChange = (e) => {
    setFontFamily(e.target.value);
    applyStyle('fontName', e.target.value);
  };

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setFontSize(size);

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      range.surroundContents(span);
    }
  };

  const handleFontColorChange = (e) => {
    const color = e.target.value;
    setFontColor(color);
    applyStyle('foreColor', color);
  };

  const handleSave = async () => {
    const content = editorRef.current.innerHTML.trim();

    if (!content) {
      alert('Cannot save an empty note!');
      return;
    }

    const now = new Date().toISOString();

    if (isNewNote) {
      try {
        const response = await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content, createdAt: now })
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || 'Failed to save the note');
        }

        const result = await response.json();
        setNotes(prevNotes => [...prevNotes, result.note]);
        setCurrentNote(result.note.content);
        setNote(result.note);
        setIsNewNote(false);
      } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save the note');
      }
    } else {
      try {
        const response = await fetch(`https://lancherixstudio-backend.onrender.com/api/users/${note.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content, createdAt: now })
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || 'Failed to update the note');
        }

        const result = await response.json();
        setNotes(prevNotes => prevNotes.map(n => n.id === result.note.id ? result.note : n));
        setNote(result.note);
        setIsNewNote(false);
        setCurrentNote(result.note.content);

        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = result.note.content;
          }
        }, 0);
      } catch (error) {
        console.error('Error updating note:', error);
        alert('Failed to update the note');
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && currentNote !== undefined) {
      editorRef.current.innerHTML = currentNote;
    }
  }, [currentNote]);

  const renderDelete = () => {
    return (
      <div className='back-logoutConfirmation'>
        <div className='all-logoutConfirmation'>
          <div className='question-logoutConfirmation'>
            <h3>Are you sure you want to delete this note?</h3>
          </div>
          <div className='options-logoutConfirmation'>
            <button className='accept-logoutConfirmation' onClick={() => handleDeleteAccept(noteIdToDelete)}>Accept</button>
            <button className='cancel-logoutConfirmation' onClick={handleDeleteCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  
    if (note) {
      setCurrentNote(note.content);
  
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = note.content;
        }
      }, 0);
    }
  };

  const handleDeleteAccept = async (noteId) => {
    try {
      const response = await fetch(`https://lancherixstudio-backend.onrender.com/api/users/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotes(prevNotes => {
          const updatedNotes = prevNotes.filter(note => note.id !== noteId);
          if (updatedNotes.length === 0) {
            setCurrentNote('');
            setNote(null);
            setIsNewNote(true);
            editorRef.current.innerHTML = '';
          } else {
            setCurrentNote('');
            setNote(null);
            setIsNewNote(false);
          }
          return updatedNotes;
        });
        setShowDeleteConfirmation(false);
        setNoteIdToDelete(null);
      } else {
        console.error('Error deleting note:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleDelete = (noteId) => {
    setShowDeleteConfirmation(true);
    setNoteIdToDelete(noteId);

    if (note) {
      setCurrentNote(note.content);
  
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = note.content;
        }
      }, 0);
    }
  };

  const insertChecklist = () => {
    const content = editorRef.current.innerHTML;
    editorRef.current.innerHTML = content + `
      <ul style="list-style-type: none; padding-left: 0;">
        <li><input type="checkbox"> -</li>
      </ul>
    `;
  };

  const fetchNotes = async () => {
    const response = await fetch('https://lancherixstudio-backend.onrender.com/api/notes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setNotes(data);
  };

  const handleNoteClick = (selectedNote) => {
    setIsNewNote(false);
    setNote(selectedNote);
    setCurrentNote(selectedNote.content);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = selectedNote.content;
      }
    }, 0);
  };

  const handleNewNoteClick = () => {
    setCurrentNote('');
    setNote(null);
    setIsNewNote(true);
    editorRef.current.innerHTML = '';
  };

  const RenderNoteEditor = ({ note }) => {
    return (
      <div className='editor-coolPage'>
        <div className='optionsEditor-coolPage'>
          <button onClick={handleSave}>Save</button>
          {note && note.id && <button onClick={() => handleDelete(note.id)}>Delete</button>}
        </div>
        <div className='characterEditor-coolPage'>
          <button className='bold-coolPage' onClick={() => applyStyle('bold')}>B</button>
          <button className='italic-coolPage' onClick={() => applyStyle('italic')}>I</button>
          <button className='underline-coolPage' onClick={() => applyStyle('underline')}>U</button>
          <select onChange={handleFontFamilyChange} value={fontFamily}>
            <option value='Arial'>Arial</option>
            <option value='Courier New'>Courier New</option>
            <option value='Georgia'>Georgia</option>
            <option value='Times New Roman'>Times New Roman</option>
            <option value='Verdana'>Verdana</option>
          </select>
          <select onChange={handleFontSizeChange} value={fontSize}>
            <option value='10px'>10px</option>
            <option value='12px'>12px</option>
            <option value='14px'>14px</option>
            <option value='16px'>16px</option>
            <option value='18px'>18px</option>
            <option value='24px'>24px</option>
            <option value='36px'>36px</option>
            <option value='45px'>45px</option>
          </select>
          <input
            type="color"
            value={fontColor}
            onChange={handleFontColorChange}
            title="Change text color"
          />
          <button onClick={() => applyStyle('insertUnorderedList')}><img src={ListIcon} /></button>
          <button onClick={() => applyStyle('insertOrderedList')}><img src={NumberListIcon} /></button>
          <button onClick={insertChecklist}><img src={CheckListIcon} /></button>
          <button onClick={() => applyStyle('justifyLeft')}><img src={AlignLeftIcon} /></button>
          <button onClick={() => applyStyle('justifyCenter')}><img src={AlignCenterIcon} /></button>
          <button onClick={() => applyStyle('justifyRight')}><img src={AlignRightIcon} /></button>
          <button onClick={() => applyStyle('justifyFull')}><img src={AlignJustifyIcon} /></button>
        </div>
      </div >
    );
  };

  const RenderNote = () => {
    return (
      <div className='content-coolPage'>
        <RenderNoteEditor note={note} />
        <div
          className='page-coolPage'
          contentEditable='true'
          ref={editorRef}
          style={{ fontFamily, fontSize }}
        >
        </div>
      </div>
    );
  };

  const RenderNewNote = () => {
    return (
      <div className='content-coolPage'>
        <RenderNoteEditor note={note} />
        <div
          className='page-coolPage'
          contentEditable='true'
          ref={editorRef}
          style={{ fontFamily, fontSize }}
        >
        </div>
      </div>
    );
  };

  return (
    <div className='all-settingsPage'>
      <div className='window-settingsPage'>
        <div className='menu-settingsPage'>
          <div className='options-coolPage'>
            <p className='optionsLibrary-coolPage'>Library</p>
            <button onClick={handleNewNoteClick}>
              <img src={AddIcon} className='resultIcon-coolPage' alt="New note" />New note
            </button>
            <p>My notes</p>
          </div>
          <div className='noteBtn-coolPage'>
            {notes
              .slice()
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .map(note => (
                <button key={note.id} onClick={() => handleNoteClick(note)} className='noteButton'>
                  <div className='noteContent-coolPage'>
                    <div className='noteTitle-coolPage'>
                      {note.content
                        .replace(/<[^>]*>/g, ' ')
                        .slice(0, 20)}
                    </div>
                    <div className='noteDate-coolPage'>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(note.updatedAt))}
                      {' '}
                      at{' '}
                      {new Intl.DateTimeFormat('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }).format(new Date(note.updatedAt))}
                    </div>
                  </div>
                </button>
              ))}
          </div>

        </div>
        {isNewNote ? <RenderNewNote /> : <RenderNote />}
      </div>
      {showDeleteConfirmation && renderDelete()}
    </div>
  );
};

export default CoolPage;*/