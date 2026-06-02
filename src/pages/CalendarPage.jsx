import React, { useState, useRef, useEffect } from "react";
import "./Styles/CalendarPage.css";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_FULL   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS      = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_COLORS  = [
  { label:"Blue",   value:"#0074ff" },
  { label:"Green",  value:"#32d74b" },
  { label:"Red",    value:"#ff453a" },
  { label:"Orange", value:"#ff9f0a" },
  { label:"Purple", value:"#bf5af2" },
  { label:"Teal",   value:"#5ac8fa" },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const uid       = () => Math.random().toString(36).substr(2,9);
const daysIn    = (y,m) => new Date(y,m+1,0).getDate();
const firstDay  = (y,m) => new Date(y,m,1).getDay();
const sameDay   = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const weekStart = (d) => { const c=new Date(d); c.setDate(c.getDate()-c.getDay()); return c; };
const fmt12     = (h,m=0) => { const hh=h%12||12; return `${hh}:${String(m).padStart(2,"0")} ${h<12?"am":"pm"}`; };

function parseNL(text) {
  const r = { title:text, date:null, startHour:null, startMinute:null, allDay:true };
  const now = new Date();
  const tm = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (tm) {
    let h = parseInt(tm[1]);
    const mins = tm[2] ? parseInt(tm[2]) : 0;
    const ap = tm[3]?.toLowerCase();
    if (ap==="pm" && h<12) h+=12;
    if (ap==="am" && h===12) h=0;
    r.startHour=h; r.startMinute=mins; r.allDay=false;
  }
  if (/\btoday\b/i.test(text)) r.date=new Date(now);
  else if (/\btomorrow\b/i.test(text)) { const d=new Date(now); d.setDate(d.getDate()+1); r.date=d; }
  const dm = text.match(/(?:on\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (dm && !r.date) {
    const td=DAYS_FULL.findIndex(x=>x.toLowerCase()===dm[1].toLowerCase());
    const d=new Date(now);
    d.setDate(d.getDate()+((td-d.getDay()+7)%7||7));
    r.date=d;
  }
  r.title = text
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,"")
    .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,"")
    .replace(/\bon\s+/gi,"").replace(/\bnext\s+/gi,"")
    .trim().replace(/\s+/g," ") || text;
  return r;
}

/* ─────────────────────────────────────────────
   EVENT MODAL
───────────────────────────────────────────── */
function EventModal({ isOpen, onClose, onSave, onDelete, initialDate, event, calendars }) {
  const today = initialDate || new Date();
  const [title,      setTitle]      = useState("");
  const [date,       setDate]       = useState(today.toISOString().slice(0,10));
  const [allDay,     setAllDay]     = useState(true);
  const [startTime,  setStartTime]  = useState("09:00");
  const [endTime,    setEndTime]    = useState("10:00");
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? "");
  const [notes,      setNotes]      = useState("");
  const [repeat,     setRepeat]     = useState("none");
  const [alert,      setAlert]      = useState("none");
  const [location,   setLocation]   = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title||"");
      setDate(new Date(event.date).toISOString().slice(0,10));
      setAllDay(event.allDay??true);
      setStartTime(event.startTime||"09:00");
      setEndTime(event.endTime||"10:00");
      setCalendarId(event.calendarId||calendars[0]?.id);
      setNotes(event.notes||"");
      setRepeat(event.repeat||"none");
      setAlert(event.alert||"none");
      setLocation(event.location||"");
    } else {
      setTitle(""); setDate(today.toISOString().slice(0,10));
      setAllDay(true); setStartTime("09:00"); setEndTime("10:00");
      setCalendarId(calendars[0]?.id??""); setNotes("");
      setRepeat("none"); setAlert("none"); setLocation("");
    }
    setTimeout(()=>inputRef.current?.focus(),50);
  }, [isOpen, event]);

  const handleTitleBlur = () => {
    const p = parseNL(title);
    if (p.title!==title) setTitle(p.title);
    if (p.date) setDate(p.date.toISOString().slice(0,10));
    if (!p.allDay && p.startHour!==null) {
      const h=String(p.startHour).padStart(2,"0"), m=String(p.startMinute).padStart(2,"0");
      setStartTime(`${h}:${m}`);
      setAllDay(false);
      setEndTime(`${String((p.startHour+1)%24).padStart(2,"0")}:${m}`);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const cal = calendars.find(c=>c.id===calendarId)||calendars[0];
    onSave({
      id: event?.id||uid(), title:title.trim(),
      date: new Date(date+"T00:00:00"), allDay,
      startTime: allDay?null:startTime, endTime: allDay?null:endTime,
      calendarId:cal?.id, color:cal?.color,
      notes, repeat, alert, location,
    });
    onClose();
  };

  if (!isOpen) return null;
  const cal = calendars.find(c=>c.id===calendarId);

  return (
    <div className="modal-overlay-calendarPage" onClick={onClose}>
      <div className="modal-calendarPage" onClick={e=>e.stopPropagation()}>
        <div className="modal-header-calendarPage" style={{borderLeft:`4px solid ${cal?.color||"#0074ff"}`}}>
          <input
            ref={inputRef}
            className="modal-title-input-calendarPage"
            placeholder="Event title or 'Call mom tomorrow at 3pm'…"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e=>e.key==="Enter"&&handleSave()}
          />
        </div>

        <div className="modal-body-calendarPage">
          {/* Calendar */}
          <div className="modal-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd"/></svg>
              Calendar
            </span>
            <select className="modal-select-calendarPage" value={calendarId} onChange={e=>setCalendarId(e.target.value)}>
              {calendars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* Date */}
          <div className="modal-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd"/></svg>
              Date
            </span>
            <input type="date" className="modal-input-calendarPage" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          {/* All day */}
          <div className="modal-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd"/></svg>
              All day
            </span>
            <label className="toggle-calendarPage">
              <input type="checkbox" checked={allDay} onChange={e=>setAllDay(e.target.checked)}/>
              <span className="toggle-slider-calendarPage"/>
            </label>
          </div>
          {/* Time */}
          {!allDay && (
            <div className="modal-row-calendarPage">
              <span className="modal-label-calendarPage">Time</span>
              <div className="modal-time-row-calendarPage">
                <input type="time" className="modal-input-calendarPage" value={startTime} onChange={e=>setStartTime(e.target.value)}/>
                <span className="modal-time-sep-calendarPage">→</span>
                <input type="time" className="modal-input-calendarPage" value={endTime} onChange={e=>setEndTime(e.target.value)}/>
              </div>
            </div>
          )}
          {/* Location */}
          <div className="modal-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077 0-4.698-3.806-8.25-8-8.25s-8 3.552-8 8.25c0 3.41 1.556 6.064 3.5 8.077a19.58 19.58 0 0 0 2.683 2.282 16.975 16.975 0 0 0 1.144.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd"/></svg>
              Location
            </span>
            <input type="text" className="modal-input-calendarPage" placeholder="Add location" value={location} onChange={e=>setLocation(e.target.value)}/>
          </div>
          {/* Repeat */}
          <div className="modal-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd"/></svg>
              Repeat
            </span>
            <select className="modal-select-calendarPage" value={repeat} onChange={e=>setRepeat(e.target.value)}>
              <option value="none">Never</option>
              <option value="daily">Every Day</option>
              <option value="weekly">Every Week</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Every Month</option>
              <option value="yearly">Every Year</option>
            </select>
          </div>
          {/* Alert */}
          <div className="modal-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd"/></svg>
              Alert
            </span>
            <select className="modal-select-calendarPage" value={alert} onChange={e=>setAlert(e.target.value)}>
              <option value="none">None</option>
              <option value="attime">At time of event</option>
              <option value="5min">5 minutes before</option>
              <option value="15min">15 minutes before</option>
              <option value="30min">30 minutes before</option>
              <option value="1hour">1 hour before</option>
              <option value="1day">1 day before</option>
            </select>
          </div>
          {/* Notes */}
          <div className="modal-row-calendarPage modal-notes-row-calendarPage">
            <span className="modal-label-calendarPage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z" clipRule="evenodd"/></svg>
              Notes
            </span>
            <textarea className="modal-textarea-calendarPage" placeholder="Add notes…" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>
        </div>

        <div className="modal-footer-calendarPage">
          {event && <button className="modal-btn-delete-calendarPage" onClick={()=>{onDelete(event.id);onClose();}}>Delete</button>}
          <div style={{flex:1}}/>
          <button className="modal-btn-cancel-calendarPage" onClick={onClose}>Cancel</button>
          <button className="modal-btn-save-calendarPage" onClick={handleSave}>{event?"Update":"Add Event"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CALENDAR MANAGER MODAL
───────────────────────────────────────────── */
function CalendarManagerModal({ isOpen, onClose, calendars, onAdd, onEdit, onDelete }) {
  const [newName,  setNewName]  = useState("");
  const [newColor, setNewColor] = useState(CAL_COLORS[0].value);
  const [editId,   setEditId]   = useState(null);
  const [editName, setEditName] = useState("");
  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({id:uid(), name:newName.trim(), color:newColor, visible:true});
    setNewName(""); setNewColor(CAL_COLORS[0].value);
  };

  return (
    <div className="modal-overlay-calendarPage" onClick={onClose}>
      <div className="modal-calendarPage modal-manager-calendarPage" onClick={e=>e.stopPropagation()}>
        <div className="modal-header-calendarPage" style={{borderLeft:"4px solid var(--buttonColor)"}}>
          <span style={{fontWeight:600,color:"var(--textTheme)",fontSize:"1rem"}}>Manage Calendars</span>
        </div>
        <div className="modal-body-calendarPage">
          {calendars.map(cal=>(
            <div key={cal.id} className="cal-manager-row-calendarPage">
              {editId===cal.id ? (
                <>
                  <input className="modal-input-calendarPage" value={editName} onChange={e=>setEditName(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){onEdit(cal.id,{name:editName});setEditId(null);}}} autoFocus/>
                  <button className="modal-btn-save-calendarPage small" onClick={()=>{onEdit(cal.id,{name:editName});setEditId(null);}}>✓</button>
                </>
              ):(
                <>
                  <span className="cal-dot-calendarPage" style={{background:cal.color}}/>
                  <span style={{flex:1,color:"var(--textTheme)",fontSize:"0.9rem"}}>{cal.name}</span>
                  <button className="cal-manager-edit-calendarPage" onClick={()=>{setEditId(cal.id);setEditName(cal.name);}}>Edit</button>
                  {calendars.length>1 && <button className="cal-manager-delete-calendarPage" onClick={()=>onDelete(cal.id)}>✕</button>}
                </>
              )}
            </div>
          ))}
          <div className="cal-manager-add-calendarPage">
            <input className="modal-input-calendarPage" placeholder="New calendar name" value={newName}
              onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
            <div className="cal-color-row-calendarPage">
              {CAL_COLORS.map(c=>(
                <span key={c.value} className={`cal-color-dot-calendarPage${newColor===c.value?" selected":""}`}
                  style={{background:c.value}} onClick={()=>setNewColor(c.value)}/>
              ))}
            </div>
            <button className="modal-btn-save-calendarPage" onClick={handleAdd}>Add Calendar</button>
          </div>
        </div>
        <div className="modal-footer-calendarPage">
          <div style={{flex:1}}/>
          <button className="modal-btn-cancel-calendarPage" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
function CalendarPage() {
  const today = new Date();

  /* ── State ── */
  const [currentDate,  setCurrentDate]  = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view,         setView]         = useState("month");
  const [selectedDay,  setSelectedDay]  = useState(today);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEventDate, setNewEventDate] = useState(null);
  const [managerOpen,  setManagerOpen]  = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [showRight,    setShowRight]    = useState(true);

  const [calendars, setCalendars] = useState([
    {id:"work",     name:"Work",     color:"#0074ff", visible:true},
    {id:"personal", name:"Personal", color:"#32d74b", visible:true},
    {id:"holidays", name:"Holidays", color:"#ff9f0a", visible:true},
  ]);

  // No placeholder events — start blank
  const [events, setEvents] = useState([]);

  /* ── Derived ── */
  const visibleCalIds = new Set(calendars.filter(c=>c.visible).map(c=>c.id));
  const visibleEvents = events.filter(e=>visibleCalIds.has(e.calendarId));
  const eventsOnDay   = d => visibleEvents
    .filter(e=>sameDay(new Date(e.date),d))
    .sort((a,b)=>{
      if(a.allDay&&!b.allDay) return -1;
      if(!a.allDay&&b.allDay) return 1;
      return (a.startTime||"").localeCompare(b.startTime||"");
    });
  const searchResults = searchTerm.trim()
    ? visibleEvents.filter(e=>e.title.toLowerCase().includes(searchTerm.toLowerCase())||e.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];
  const upcomingEvents = visibleEvents
    .filter(e=>new Date(e.date)>=new Date(today.getFullYear(),today.getMonth(),today.getDate()))
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
    .slice(0,10);

  /* ── Event CRUD ── */
  const saveEvent = ev => {
    const cal = calendars.find(c=>c.id===ev.calendarId);
    const colored = {...ev, color:cal?.color||"#0074ff"};
    setEvents(prev=>prev.find(e=>e.id===ev.id) ? prev.map(e=>e.id===ev.id?colored:e) : [...prev,colored]);
  };
  const deleteEvent = id => setEvents(prev=>prev.filter(e=>e.id!==id));
  const openNew = date => { setEditingEvent(null); setNewEventDate(date||selectedDay); setModalOpen(true); };
  const openEdit = (ev,e) => { e.stopPropagation(); setEditingEvent(ev); setModalOpen(true); };

  /* ── Calendar CRUD ── */
  const addCalendar    = cal => setCalendars(prev=>[...prev,cal]);
  const editCalendar   = (id,u) => { setCalendars(prev=>prev.map(c=>c.id===id?{...c,...u}:c)); setEvents(prev=>prev.map(e=>e.calendarId===id?{...e,color:u.color||e.color}:e)); };
  const deleteCalendar = id => { setCalendars(prev=>prev.filter(c=>c.id!==id)); setEvents(prev=>prev.filter(e=>e.calendarId!==id)); };
  const toggleCalendar = id => setCalendars(prev=>prev.map(c=>c.id===id?{...c,visible:!c.visible}:c));

  /* ── Navigation ── */
  const navigate = dir => {
    const d = new Date(currentDate);
    if (view==="month")      d.setMonth(d.getMonth()+dir);
    else if (view==="week")  d.setDate(d.getDate()+dir*7);
    else if (view==="day")   d.setDate(d.getDate()+dir);
    else if (view==="year")  d.setFullYear(d.getFullYear()+dir);
    setCurrentDate(d);
  };
  const goToday = () => { setCurrentDate(new Date(today.getFullYear(),today.getMonth(),1)); setSelectedDay(today); };

  const headerLabel = () => {
    if (view==="month") return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view==="year")  return `${currentDate.getFullYear()}`;
    if (view==="week") {
      const s=weekStart(currentDate), e=new Date(s); e.setDate(e.getDate()+6);
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${s.getMonth()!==e.getMonth()?MONTHS[e.getMonth()]+" ":""}${e.getDate()}, ${s.getFullYear()}`;
    }
    if (view==="day") return `${DAYS_FULL[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}`;
  };

  /* ══════════════════════════════════════════
     VIEW RENDERERS
  ══════════════════════════════════════════ */

  /* ── MONTH ──
     Always renders exactly 6 rows (42 cells) so the grid never
     changes height or needs to scroll.
  ── */
  const renderMonth = () => {
    const y=currentDate.getFullYear(), m=currentDate.getMonth();
    const dim=daysIn(y,m), fd=firstDay(y,m), dimPrev=daysIn(y,m-1);
    const cells=[];
    // Leading days from previous month
    for(let i=fd-1;i>=0;i--)  cells.push({day:dimPrev-i, cur:false, date:new Date(y,m-1,dimPrev-i)});
    // Current month days
    for(let d=1;d<=dim;d++)    cells.push({day:d, cur:true, date:new Date(y,m,d)});
    // Trailing days — pad to exactly 42 (6 weeks)
    let nx=1;
    while(cells.length<42)     cells.push({day:nx++, cur:false, date:new Date(y,m+1,nx-2)});

    return (
      <div className="month-grid-calendarPage">
        {DAYS_SHORT.map(d=><div key={d} className="month-dow-calendarPage">{d}</div>)}
        {cells.map((cell,i)=>{
          const dayEvs=eventsOnDay(cell.date);
          const isToday=sameDay(cell.date,today);
          const isSel=sameDay(cell.date,selectedDay);
          return (
            <div key={i}
              className={`month-cell-calendarPage${!cell.cur?" other-month":""}${isToday?" today":""}${isSel?" selected":""}`}
              onClick={()=>{setSelectedDay(cell.date);setCurrentDate(new Date(cell.date.getFullYear(),cell.date.getMonth(),1));}}
              onDoubleClick={()=>openNew(cell.date)}
            >
              <span className="month-day-num-calendarPage">{cell.day}</span>
              <div className="month-cell-events-calendarPage">
                {dayEvs.slice(0,3).map(ev=>(
                  <div key={ev.id} className="month-event-calendarPage"
                    style={{background:ev.color+"22",borderLeft:`3px solid ${ev.color}`,color:ev.color}}
                    onClick={e=>openEdit(ev,e)} title={ev.title}>
                    {!ev.allDay&&ev.startTime&&<span className="event-time-chip-calendarPage">{fmt12(...ev.startTime.split(":").map(Number))}</span>}
                    <span className="event-title-clip-calendarPage">{ev.title}</span>
                  </div>
                ))}
                {dayEvs.length>3&&(
                  <div className="month-more-calendarPage"
                    onClick={e=>{e.stopPropagation();setSelectedDay(cell.date);setView("day");}}>
                    +{dayEvs.length-3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── WEEK ──
     Layout: left gutter (time labels) + 7 equal columns.
     Each column header shows: DOW name + day number + all-day events.
     The scrollable time grid below uses the same 7-column layout.
  ── */
  const renderWeek = () => {
    const start=weekStart(currentDate);
    const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d;});
    const hours=Array.from({length:24},(_,i)=>i);

    return (
      <div className="week-view-calendarPage">
        {/* Column headers — DOW + date number + all-day events inline */}
        <div className="week-header-calendarPage">
          <div className="week-gutter-calendarPage"/>
          {days.map((d,i)=>{
            const allDayEvs=eventsOnDay(d).filter(e=>e.allDay);
            return (
              <div key={i}
                className={`week-header-day-calendarPage${sameDay(d,today)?" today-col":""}`}
                onClick={()=>{setSelectedDay(d);setView("day");setCurrentDate(new Date(d.getFullYear(),d.getMonth(),d.getDate()));}}>
                <span className="week-dow-label-calendarPage">{DAYS_SHORT[d.getDay()]}</span>
                <span className={`week-day-num-calendarPage${sameDay(d,today)?" today-num":""}`}>{d.getDate()}</span>
                {/* All-day events sit directly under the date number */}
                {allDayEvs.length>0&&(
                  <div className="week-allday-events-calendarPage">
                    {allDayEvs.map(ev=>(
                      <div key={ev.id} className="week-event-calendarPage allday-ev"
                        style={{background:ev.color+"22",borderLeft:`3px solid ${ev.color}`,color:ev.color}}
                        onClick={e=>{e.stopPropagation();openEdit(ev,e);}}>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div className="week-grid-calendarPage">
          {hours.map(h=>(
            <React.Fragment key={h}>
              <div className="week-time-label-calendarPage">{fmt12(h)}</div>
              {days.map((d,i)=>{
                const ces=eventsOnDay(d).filter(e=>{if(e.allDay)return false;const[eh]=(e.startTime||"00:00").split(":").map(Number);return eh===h;});
                return (
                  <div key={i} className={`week-cell-calendarPage${sameDay(d,today)?" today-col":""}`}
                    onDoubleClick={()=>openNew(d)}>
                    {ces.map(ev=>(
                      <div key={ev.id} className="week-event-calendarPage"
                        style={{background:ev.color+"22",borderLeft:`3px solid ${ev.color}`,color:ev.color}}
                        onClick={e=>openEdit(ev,e)}>
                        <span style={{fontSize:"0.65rem",marginRight:4}}>{ev.startTime}</span>{ev.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  /* ── DAY ── */
  const renderDay = () => {
    const d = view==="day" ? currentDate : selectedDay;
    const hours=Array.from({length:24},(_,i)=>i);
    const allDayEvs=eventsOnDay(d).filter(e=>e.allDay);
    const isToday=sameDay(d,today);

    return (
      <div className="day-view-calendarPage">
        <div className="day-header-calendarPage">
          <span className={`day-header-num-calendarPage${isToday?" today-num":""}`}>{d.getDate()}</span>
          <span className="day-header-label-calendarPage">{DAYS_FULL[d.getDay()]}{isToday?" · Today":""}</span>
        </div>
        {allDayEvs.length>0&&(
          <div className="day-allday-section-calendarPage">
            {allDayEvs.map(ev=>(
              <div key={ev.id} className="day-event-calendarPage"
                style={{background:ev.color+"22",borderLeft:`4px solid ${ev.color}`,color:ev.color}}
                onClick={e=>openEdit(ev,e)}>
                <span className="event-badge-calendarPage" style={{background:ev.color}}>All day</span>
                <span>{ev.title}</span>
                {ev.location&&<span className="event-location-calendarPage">📍 {ev.location}</span>}
              </div>
            ))}
          </div>
        )}
        <div className="day-grid-calendarPage">
          {hours.map(h=>{
            const ces=eventsOnDay(d).filter(e=>{if(e.allDay)return false;const[eh]=(e.startTime||"00:00").split(":").map(Number);return eh===h;});
            const isCurHour=isToday&&new Date().getHours()===h;
            return (
              <div key={h} className={`day-row-calendarPage${isCurHour?" current-hour":""}`} onDoubleClick={()=>openNew(d)}>
                <div className="day-time-label-calendarPage">{fmt12(h)}</div>
                <div className="day-cell-calendarPage">
                  {isCurHour&&<div className="now-line-calendarPage" style={{top:`${(new Date().getMinutes()/60)*100}%`}}/>}
                  {ces.map(ev=>(
                    <div key={ev.id} className="day-event-block-calendarPage"
                      style={{background:ev.color+"22",borderLeft:`4px solid ${ev.color}`,color:ev.color}}
                      onClick={e=>openEdit(ev,e)}>
                      <span className="event-badge-calendarPage" style={{background:ev.color}}>{ev.startTime} – {ev.endTime}</span>
                      <strong>{ev.title}</strong>
                      {ev.location&&<span className="event-location-calendarPage">📍 {ev.location}</span>}
                      {ev.notes&&<span className="event-notes-calendarPage">{ev.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── YEAR ── */
  const renderYear = () => {
    const y=currentDate.getFullYear();
    return (
      <div className="year-grid-calendarPage">
        {MONTHS.map((mName,mi)=>{
          const fd=firstDay(y,mi), dim=daysIn(y,mi);
          const cells=[];
          for(let i=0;i<fd;i++) cells.push(null);
          for(let d=1;d<=dim;d++) cells.push(d);
          return (
            <div key={mi} className="year-month-calendarPage"
              onClick={()=>{setCurrentDate(new Date(y,mi,1));setView("month");}}>
              <div className="year-month-name-calendarPage">{mName}</div>
              <div className="year-mini-grid-calendarPage">
                {DAYS_SHORT.map(d=><div key={d} className="year-mini-dow-calendarPage">{d[0]}</div>)}
                {cells.map((day,ci)=>{
                  if(!day) return <div key={`e-${ci}`}/>;
                  const dd=new Date(y,mi,day);
                  const isTd=sameDay(dd,today), hasEvs=eventsOnDay(dd).length>0;
                  return (
                    <div key={ci} className={`year-mini-day-calendarPage${isTd?" today":""}${hasEvs?" has-events":""}`}
                      onClick={e=>{e.stopPropagation();setSelectedDay(dd);setCurrentDate(new Date(y,mi,1));setView("day");}}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── MINI CALENDAR (sidebar) ── */
  const renderMiniCal = () => {
    const y=selectedDay.getFullYear(), m=selectedDay.getMonth();
    const dim=daysIn(y,m), fd=firstDay(y,m);
    const cells=[];
    for(let i=0;i<fd;i++) cells.push(null);
    for(let d=1;d<=dim;d++) cells.push(d);
    const prev=()=>setSelectedDay(new Date(y,m-1,1));
    const next=()=>setSelectedDay(new Date(y,m+1,1));
    return (
      <div className="mini-cal-calendarPage">
        <div className="mini-cal-header-calendarPage">
          <button onClick={prev} className="mini-cal-nav-calendarPage">‹</button>
          <span>{MONTHS[m].slice(0,3)} {y}</span>
          <button onClick={next} className="mini-cal-nav-calendarPage">›</button>
        </div>
        <div className="mini-cal-grid-calendarPage">
          {DAYS_SHORT.map(d=><div key={d} className="mini-cal-dow-calendarPage">{d[0]}</div>)}
          {cells.map((day,i)=>{
            if(!day) return <div key={`e-${i}`}/>;
            const d=new Date(y,m,day);
            const isT=sameDay(d,today), isSel=sameDay(d,selectedDay), hasEvs=eventsOnDay(d).length>0;
            return (
              <div key={i} className={`mini-cal-day-calendarPage${isT?" today":""}${isSel?" selected":""}${hasEvs?" has-events":""}`}
                onClick={()=>{setSelectedDay(d);setCurrentDate(new Date(y,m,1));}}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="all-calendarPage">
      <div className="window-calendarPage">

        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <aside className="panel-calendarPage">

          {/* New event button */}
          <button className="add-event-btn-calendarPage" onClick={()=>openNew(selectedDay)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd"/>
            </svg>
            New Event
          </button>

          {/* Mini calendar */}
          {renderMiniCal()}

          {/* Search */}
          <div className="panel-search-calendarPage">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd"/>
            </svg>
            <input type="text" placeholder="Search events…" value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)} className="panel-search-input-calendarPage"/>
          </div>

          {/* Search results */}
          {searchTerm&&(
            <div className="search-results-calendarPage">
              {searchResults.length===0
                ? <div className="no-results-calendarPage">No events found</div>
                : searchResults.map(ev=>(
                  <div key={ev.id} className="search-result-item-calendarPage" onClick={e=>openEdit(ev,e)}>
                    <span className="cal-dot-calendarPage" style={{background:ev.color}}/>
                    <div>
                      <div style={{fontWeight:600,color:"var(--textTheme)",fontSize:"0.8rem"}}>{ev.title}</div>
                      <div style={{color:"var(--placeholderTheme)",fontSize:"0.7rem"}}>
                        {new Date(ev.date).toLocaleDateString()}{!ev.allDay&&` · ${ev.startTime}`}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* My Calendars */}
          <div className="panel-section-calendarPage">
            <div className="panel-section-header-calendarPage">
              <span>My Calendars</span>
              <button className="panel-section-btn-calendarPage" onClick={()=>setManagerOpen(true)} title="Manage">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"/>
                  <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"/>
                </svg>
              </button>
            </div>
            {calendars.map(cal=>(
              <div key={cal.id} className="panel-cal-row-calendarPage" onClick={()=>toggleCalendar(cal.id)}>
                <span className={`cal-checkbox-calendarPage${cal.visible?" checked":""}`} style={{borderColor:cal.color,background:cal.visible?cal.color:"transparent"}}>
                  {cal.visible&&<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd"/></svg>}
                </span>
                <span className="cal-name-calendarPage">{cal.name}</span>
              </div>
            ))}
          </div>

          <div style={{flex:1}}/>
        </aside>

        {/* ═══════════════ MAIN SECTION ═══════════════ */}
        <section className="calendar-calendarPage">
          <div className="mainColumn-calendarPage">

            {/* ── Toolbar ── */}
            <div className="options-calendarPage">
              <div className="toolbar-inner-calendarPage">
                <div className="toolbar-left-calendarPage">
                  <button className="toolbar-today-calendarPage" onClick={goToday}>Today</button>
                  <button className="toolbar-nav-calendarPage" onClick={()=>navigate(-1)}>‹</button>
                  <button className="toolbar-nav-calendarPage" onClick={()=>navigate(1)}>›</button>
                  <span className="toolbar-title-calendarPage">{headerLabel()}</span>
                </div>
                <div className="toolbar-right-calendarPage">
                  {["month","week","day","year"].map(v=>(
                    <button key={v}
                      className={`toolbar-view-btn-calendarPage${view===v?" active":""}`}
                      onClick={()=>setView(v)}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                  <button className="toolbar-add-calendarPage" onClick={()=>openNew(selectedDay)} title="New event">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  <button className="toolbar-toggle-panel-calendarPage" onClick={()=>setShowRight(p=>!p)} title="Toggle details panel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Calendar grid ── */}
            <div className="grid-calendarPage">
              {view==="month" && renderMonth()}
              {view==="week"  && renderWeek()}
              {view==="day"   && renderDay()}
              {view==="year"  && renderYear()}
            </div>

          </div>

          {/* ═══════════════ RIGHT PANEL ═══════════════ */}
          {showRight && (
            <aside className="rightPanel-calendarPage">

              <div className="right-day-header-calendarPage">
                <div className={`right-day-num-calendarPage${sameDay(selectedDay,today)?" today-num":""}`}>
                  {selectedDay.getDate()}
                </div>
                <div>
                  <div className="right-day-name-calendarPage">{DAYS_FULL[selectedDay.getDay()]}</div>
                  <div className="right-month-name-calendarPage">{MONTHS[selectedDay.getMonth()]} {selectedDay.getFullYear()}</div>
                </div>
                <button className="right-add-btn-calendarPage" onClick={()=>openNew(selectedDay)} title="Add event on this day">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              <div className="right-events-section-calendarPage">
                <h4 className="right-section-title-calendarPage">
                  {eventsOnDay(selectedDay).length
                    ? `${eventsOnDay(selectedDay).length} event${eventsOnDay(selectedDay).length>1?"s":""}`
                    : "No events"}
                </h4>
                <div className="right-events-list-calendarPage">
                  {eventsOnDay(selectedDay).length===0
                    ? <div className="right-empty-calendarPage">Double-click a day to add an event</div>
                    : eventsOnDay(selectedDay).map(ev=>(
                      <div key={ev.id} className="right-event-item-calendarPage"
                        style={{borderLeft:`3px solid ${ev.color}`}}
                        onClick={e=>openEdit(ev,e)}>
                        <div className="right-event-title-calendarPage">{ev.title}</div>
                        <div className="right-event-meta-calendarPage">
                          {ev.allDay ? "All day" : `${ev.startTime} – ${ev.endTime}`}
                          {ev.location&&<span> · 📍 {ev.location}</span>}
                        </div>
                        {ev.notes&&<div className="right-event-notes-calendarPage">{ev.notes}</div>}
                        {ev.repeat&&ev.repeat!=="none"&&(
                          <div className="right-event-badge-calendarPage">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{width:10,height:10,marginRight:3}}>
                              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd"/>
                            </svg>
                            {ev.repeat}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="right-divider-calendarPage"/>

              <div className="right-upcoming-section-calendarPage">
                <h4 className="right-section-title-calendarPage">Upcoming</h4>
                <div className="right-upcoming-list-calendarPage">
                  {upcomingEvents.length===0
                    ? <div className="right-empty-calendarPage">No upcoming events</div>
                    : upcomingEvents.map(ev=>{
                      const d=new Date(ev.date);
                      const isEvToday=sameDay(d,today);
                      return (
                        <div key={ev.id} className="right-upcoming-item-calendarPage" onClick={e=>openEdit(ev,e)}>
                          <div className="right-upcoming-date-calendarPage">
                            <span className="right-upcoming-dayname-calendarPage">{isEvToday?"Today":DAYS_SHORT[d.getDay()]}</span>
                            <span className="right-upcoming-daynum-calendarPage">{d.getDate()}</span>
                          </div>
                          <div className="right-upcoming-event-calendarPage" style={{borderLeft:`2px solid ${ev.color}`}}>
                            <span className="right-upcoming-title-calendarPage">{ev.title}</span>
                            <span className="right-upcoming-time-calendarPage">{ev.allDay?"All day":ev.startTime}</span>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>

            </aside>
          )}
        </section>
      </div>

      {/* ── Modals ── */}
      <EventModal
        isOpen={modalOpen}
        onClose={()=>{setModalOpen(false);setEditingEvent(null);}}
        onSave={saveEvent}
        onDelete={deleteEvent}
        initialDate={newEventDate||selectedDay}
        event={editingEvent}
        calendars={calendars}
      />
      <CalendarManagerModal
        isOpen={managerOpen}
        onClose={()=>setManagerOpen(false)}
        calendars={calendars}
        onAdd={addCalendar}
        onEdit={editCalendar}
        onDelete={deleteCalendar}
      />
    </div>
  );
}

export default CalendarPage;