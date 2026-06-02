import React, { useState, useRef, useEffect } from "react";
import "./Styles/CalendarPage.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n) { return String(n).padStart(2, "0"); }
function today() { return new Date(); }
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const CALENDAR_COLORS = [
  "#3b82f6","#22c55e","#f59e0b","#ef4444","#a855f7","#14b8a6","#f97316",
];

function parseNaturalEvent(text) {
  const now = new Date();
  let title = text.trim();
  let date = new Date(now);
  let startHour = 9, startMin = 0, endHour = 10, endMin = 0;

  // detect time like "at 9pm", "at 14:30"
  const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = parseInt(timeMatch[2] || "0");
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    startHour = h; startMin = m;
    endHour = h + 1; endMin = m;
    title = title.replace(timeMatch[0], "").trim();
  }

  // detect date keywords
  if (/tomorrow/i.test(text)) {
    date = addDays(now, 1);
    title = title.replace(/tomorrow/i, "").trim();
  } else if (/today/i.test(text)) {
    title = title.replace(/today/i, "").trim();
  } else {
    // detect month day like "December 31" or "the 31st"
    const monthDay = text.match(new RegExp(`(${MONTHS.join("|")})\\s+(\\d{1,2})`, "i"));
    if (monthDay) {
      const mIdx = MONTHS.findIndex(m => m.toLowerCase() === monthDay[1].toLowerCase());
      date = new Date(now.getFullYear(), mIdx, parseInt(monthDay[2]));
      title = title.replace(monthDay[0], "").trim();
    }
  }

  // clean trailing prepositions
  title = title.replace(/^(on|for|a|an|the)\s+/i, "").trim();
  if (!title) title = "New Event";

  date.setHours(startHour, startMin, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(endHour, endMin, 0, 0);

  return { title, date, endDate, allDay: false };
}

// ─── seed events ────────────────────────────────────────────────────────────

function makeSeedEvents() {
  const t = today();
  const y = t.getFullYear(), m = t.getMonth();
  const id = () => Math.random().toString(36).slice(2);
  return [
    { id: id(), title: "Team Stand-up", calendar: "Work", color: "#3b82f6",
      date: new Date(y, m, t.getDate(), 9, 0),
      endDate: new Date(y, m, t.getDate(), 9, 30), allDay: false },
    { id: id(), title: "Lunch with Mike", calendar: "Personal", color: "#22c55e",
      date: new Date(y, m, t.getDate(), 12, 30),
      endDate: new Date(y, m, t.getDate(), 13, 30), allDay: false },
    { id: id(), title: "Project Review", calendar: "Work", color: "#3b82f6",
      date: new Date(y, m, t.getDate() + 1, 14, 0),
      endDate: new Date(y, m, t.getDate() + 1, 15, 0), allDay: false },
    { id: id(), title: "Ski Weekend", calendar: "Travel", color: "#f59e0b",
      date: new Date(y, m, t.getDate() + 4),
      endDate: new Date(y, m, t.getDate() + 6), allDay: true },
    { id: id(), title: "Staff Meeting", calendar: "Work", color: "#3b82f6",
      date: new Date(y, m, t.getDate() + 2, 10, 0),
      endDate: new Date(y, m, t.getDate() + 2, 11, 0), allDay: false },
    { id: id(), title: "Birthday Party", calendar: "Personal", color: "#22c55e",
      date: new Date(y, m, t.getDate() + 7, 18, 0),
      endDate: new Date(y, m, t.getDate() + 7, 21, 0), allDay: false },
  ];
}

// ─── EventModal ──────────────────────────────────────────────────────────────

function EventModal({ event, onClose, onSave, onDelete, calendars }) {
  const [title, setTitle] = useState(event?.title || "");
  const [calName, setCalName] = useState(event?.calendar || calendars[0]?.name || "Personal");
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [dateStr, setDateStr] = useState(
    event?.date ? `${event.date.getFullYear()}-${pad(event.date.getMonth()+1)}-${pad(event.date.getDate())}` : ""
  );
  const [startTime, setStartTime] = useState(
    event?.date && !event.allDay ? `${pad(event.date.getHours())}:${pad(event.date.getMinutes())}` : "09:00"
  );
  const [endTime, setEndTime] = useState(
    event?.endDate && !event.allDay ? `${pad(event.endDate.getHours())}:${pad(event.endDate.getMinutes())}` : "10:00"
  );
  const [location, setLocation] = useState(event?.location || "");
  const [notes, setNotes] = useState(event?.notes || "");

  const cal = calendars.find(c => c.name === calName) || calendars[0];

  function handleSave() {
    if (!title.trim() || !dateStr) return;
    const [y, mo, d] = dateStr.split("-").map(Number);
    let date = new Date(y, mo - 1, d);
    let endDate = new Date(y, mo - 1, d);
    if (!allDay) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      date.setHours(sh, sm);
      endDate.setHours(eh, em);
    }
    onSave({ ...event, title: title.trim(), calendar: calName, color: cal?.color, allDay, date, endDate, location, notes });
  }

  return (
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header" style={{ borderLeft: `4px solid ${cal?.color || "#3b82f6"}` }}>
          <input
            className="cal-modal-title-input"
            placeholder="Event title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <button className="cal-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cal-modal-body">
          <div className="cal-modal-row">
            <span className="cal-modal-label">📅 Date</span>
            <input type="date" className="cal-modal-input" value={dateStr} onChange={e => setDateStr(e.target.value)} />
          </div>
          <div className="cal-modal-row">
            <span className="cal-modal-label">⏱ All Day</span>
            <label className="cal-toggle">
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
              <span className="cal-toggle-slider" />
            </label>
          </div>
          {!allDay && (
            <div className="cal-modal-row">
              <span className="cal-modal-label">🕐 Time</span>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <input type="time" className="cal-modal-input cal-modal-input-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <span style={{ color:"var(--placeholderTheme)" }}>→</span>
                <input type="time" className="cal-modal-input cal-modal-input-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}
          <div className="cal-modal-row">
            <span className="cal-modal-label">📁 Calendar</span>
            <select className="cal-modal-input" value={calName} onChange={e => setCalName(e.target.value)}>
              {calendars.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="cal-modal-row">
            <span className="cal-modal-label">📍 Location</span>
            <input className="cal-modal-input" placeholder="Add location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="cal-modal-row cal-modal-row-col">
            <span className="cal-modal-label">📝 Notes</span>
            <textarea className="cal-modal-textarea" placeholder="Add notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="cal-modal-footer">
          {event?.id && <button className="cal-btn-danger" onClick={() => onDelete(event.id)}>Delete</button>}
          <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
            <button className="cal-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="cal-btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QuickAdd ────────────────────────────────────────────────────────────────

function QuickAdd({ onAdd, onClose, defaultDate }) {
  const [text, setText] = useState("");
  function handle(e) {
    if (e.key === "Enter" && text.trim()) {
      const parsed = parseNaturalEvent(text);
      if (defaultDate) {
        parsed.date = new Date(defaultDate);
        parsed.date.setHours(9, 0, 0, 0);
        parsed.endDate = new Date(defaultDate);
        parsed.endDate.setHours(10, 0, 0, 0);
      }
      onAdd(parsed);
      setText("");
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  }
  return (
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div className="cal-quick-add" onClick={e => e.stopPropagation()}>
        <p className="cal-quick-label">New Quick Event</p>
        <input
          className="cal-quick-input"
          placeholder='e.g. "Lunch tomorrow at 1pm"'
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handle}
          autoFocus
        />
        <p className="cal-quick-hint">Press Enter to save · Esc to cancel</p>
      </div>
    </div>
  );
}

// ─── EventPill ───────────────────────────────────────────────────────────────

function EventPill({ event, onClick, compact }) {
  return (
    <div
      className={`cal-event-pill ${compact ? "compact" : ""}`}
      style={{ backgroundColor: event.color + "33", borderLeft: `3px solid ${event.color}`, color: event.color }}
      onClick={e => { e.stopPropagation(); onClick(event); }}
      title={event.title}
    >
      {!compact && !event.allDay && (
        <span className="cal-event-time">
          {pad(event.date.getHours())}:{pad(event.date.getMinutes())}
        </span>
      )}
      <span className="cal-event-name">{event.title}</span>
    </div>
  );
}

// ─── DayView ─────────────────────────────────────────────────────────────────

function DayView({ currentDate, events, onSlotClick, onEventClick }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60;
  }, []);
  const nowRef = useRef(null);
  useEffect(() => {
    if (nowRef.current) nowRef.current.scrollIntoView({ block: "center" });
  }, []);

  const dayEvents = events.filter(e => !e.allDay && sameDay(e.date, currentDate));
  const allDayEvents = events.filter(e => e.allDay && sameDay(e.date, currentDate));
  const isToday = sameDay(currentDate, today());
  const nowMinutes = today().getHours() * 60 + today().getMinutes();

  return (
    <div className="cal-day-view">
      {allDayEvents.length > 0 && (
        <div className="cal-allday-strip">
          <span className="cal-allday-label">All Day</span>
          <div className="cal-allday-events">
            {allDayEvents.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} compact />)}
          </div>
        </div>
      )}
      <div className="cal-time-grid" ref={scrollRef}>
        {HOURS.map(h => {
          const slotEvents = dayEvents.filter(e => e.date.getHours() === h);
          return (
            <div key={h} className="cal-hour-row" onClick={() => onSlotClick(currentDate, h)}>
              <div className="cal-hour-label">
                {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h-12} PM`}
              </div>
              <div className="cal-hour-slot">
                {isToday && h === today().getHours() && (
                  <div ref={nowRef} className="cal-now-line" style={{ top: `${(today().getMinutes()/60)*100}%` }} />
                )}
                {slotEvents.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WeekView ────────────────────────────────────────────────────────────────

function WeekView({ currentDate, events, onSlotClick, onEventClick }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60;
  }, []);

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const t = today();

  return (
    <div className="cal-week-view">
      {/* header */}
      <div className="cal-week-header">
        <div className="cal-week-corner" />
        {weekDays.map((d, i) => (
          <div key={i} className={`cal-week-day-header ${sameDay(d, t) ? "today" : ""}`}>
            <span className="cal-wdh-name">{DAYS[d.getDay()]}</span>
            <span className={`cal-wdh-num ${sameDay(d, t) ? "today-circle" : ""}`}>{d.getDate()}</span>
          </div>
        ))}
      </div>
      {/* all day row */}
      <div className="cal-week-allday">
        <div className="cal-week-corner-sm">All Day</div>
        {weekDays.map((d, i) => {
          const adEvts = events.filter(e => e.allDay && sameDay(e.date, d));
          return (
            <div key={i} className="cal-week-allday-cell">
              {adEvts.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} compact />)}
            </div>
          );
        })}
      </div>
      {/* grid */}
      <div className="cal-week-grid" ref={scrollRef}>
        {HOURS.map(h => (
          <div key={h} className="cal-week-hour-row">
            <div className="cal-hour-label-sm">
              {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h-12} PM`}
            </div>
            {weekDays.map((d, di) => {
              const slotEvts = events.filter(e => !e.allDay && sameDay(e.date, d) && e.date.getHours() === h);
              const isTodaySlot = sameDay(d, t);
              return (
                <div key={di} className={`cal-week-cell ${isTodaySlot ? "today-col" : ""}`}
                  onClick={() => onSlotClick(d, h)}>
                  {isTodaySlot && h === t.getHours() && (
                    <div className="cal-now-line" style={{ top: `${(t.getMinutes()/60)*100}%` }} />
                  )}
                  {slotEvts.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} compact />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MonthView ───────────────────────────────────────────────────────────────

function MonthView({ currentDate, events, onDayClick, onEventClick }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const numDays = daysInMonth(year, month);
  const t = today();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d));

  return (
    <div className="cal-month-view">
      <div className="cal-month-dow-row">
        {DAYS.map(d => <div key={d} className="cal-month-dow">{d}</div>)}
      </div>
      <div className="cal-month-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-month-cell empty" />;
          const dayEvts = events.filter(e => sameDay(e.date, d));
          const isTd = sameDay(d, t);
          return (
            <div key={i} className={`cal-month-cell ${isTd ? "today" : ""}`}
              onClick={() => onDayClick(d)}>
              <span className={`cal-month-num ${isTd ? "today-circle" : ""}`}>{d.getDate()}</span>
              <div className="cal-month-events">
                {dayEvts.slice(0, 3).map(e => (
                  <EventPill key={e.id} event={e} onClick={onEventClick} compact />
                ))}
                {dayEvts.length > 3 && (
                  <div className="cal-month-more">+{dayEvts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── YearView ────────────────────────────────────────────────────────────────

function YearView({ currentDate, events, onMonthClick }) {
  const year = currentDate.getFullYear();
  const t = today();
  return (
    <div className="cal-year-view">
      {MONTHS.map((mName, mi) => {
        const firstDay = new Date(year, mi, 1).getDay();
        const numDays = daysInMonth(year, mi);
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= numDays; d++) cells.push(d);
        return (
          <div key={mi} className="cal-year-month" onClick={() => onMonthClick(year, mi)}>
            <div className="cal-year-month-name">{mName}</div>
            <div className="cal-year-mini-grid">
              {DAYS.map(d => <div key={d} className="cal-mini-dow">{d[0]}</div>)}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const cellDate = new Date(year, mi, d);
                const hasEvt = events.some(e => sameDay(e.date, cellDate));
                const isTd = sameDay(cellDate, t);
                return (
                  <div key={i} className={`cal-mini-day ${isTd ? "today-circle" : ""} ${hasEvt ? "has-event" : ""}`}>
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main CalendarPage ───────────────────────────────────────────────────────

function CalendarPage() {
  const [view, setView] = useState("month"); // day | week | month | year
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(makeSeedEvents());
  const [calendars, setCalendars] = useState([
    { name: "Personal", color: "#22c55e", visible: true },
    { name: "Work",     color: "#3b82f6", visible: true },
    { name: "Travel",   color: "#f59e0b", visible: true },
    { name: "Holidays", color: "#ef4444", visible: true },
  ]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [quickDate, setQuickDate] = useState(null);
  const [search, setSearch] = useState("");
  const [showCalendarsPanel, setShowCalendarsPanel] = useState(true);
  const [newCalName, setNewCalName] = useState("");

  const visibleCals = new Set(calendars.filter(c => c.visible).map(c => c.name));
  const filteredEvents = events.filter(e => visibleCals.has(e.calendar) &&
    (!search || e.title.toLowerCase().includes(search.toLowerCase())));

  // ── navigation ──
  function navigate(dir) {
    const d = new Date(currentDate);
    if (view === "day")   d.setDate(d.getDate() + dir);
    if (view === "week")  d.setDate(d.getDate() + dir * 7);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    if (view === "year")  d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
  }
  function goToday() { setCurrentDate(new Date()); }

  function headerLabel() {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    if (view === "day")   return `${DAYS[currentDate.getDay()]}, ${MONTHS[m]} ${currentDate.getDate()}, ${y}`;
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      return `${MONTHS[ws.getMonth()]} ${ws.getDate()} – ${we.getDate()}, ${y}`;
    }
    if (view === "month") return `${MONTHS[m]} ${y}`;
    if (view === "year")  return `${y}`;
  }

  // ── event crud ──
  function handleSaveEvent(ev) {
    const cal = calendars.find(c => c.name === ev.calendar);
    const color = cal ? cal.color : "#3b82f6";
    if (ev.id) {
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...ev, color } : e));
    } else {
      setEvents(prev => [...prev, { ...ev, color, id: Math.random().toString(36).slice(2) }]);
    }
    setShowModal(false);
    setSelectedEvent(null);
  }
  function handleDeleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    setShowModal(false);
    setSelectedEvent(null);
  }
  function handleEventClick(ev) {
    setSelectedEvent(ev);
    setShowModal(true);
  }
  function handleSlotClick(date, hour) {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    const end = new Date(d);
    end.setHours(hour + 1, 0, 0, 0);
    setSelectedEvent({ title: "", date: d, endDate: end, allDay: false, calendar: "Personal", color: "#22c55e", notes: "", location: "" });
    setShowModal(true);
  }
  function handleDayClick(date) {
    setCurrentDate(date);
    setView("day");
  }
  function handleMonthClick(year, month) {
    setCurrentDate(new Date(year, month, 1));
    setView("month");
  }
  function handleQuickAdd(parsed) {
    const cal = calendars[0];
    setEvents(prev => [...prev, {
      ...parsed,
      id: Math.random().toString(36).slice(2),
      calendar: cal.name,
      color: cal.color,
      notes: "",
      location: "",
    }]);
  }

  function addCalendar() {
    if (!newCalName.trim()) return;
    const color = CALENDAR_COLORS[calendars.length % CALENDAR_COLORS.length];
    setCalendars(prev => [...prev, { name: newCalName.trim(), color, visible: true }]);
    setNewCalName("");
  }

  // search results
  const searchResults = search
    ? events.filter(e => e.title.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="all-calendarPage">
      <div className="window-calendarPage">

        {/* ── Top Bar ── */}
        <div className="topbar-calendarPage">
          <div className="topbar-left-calendarPage">
            <button className="cal-icon-btn" onClick={() => setShowCalendarsPanel(p => !p)} title="Toggle Calendars">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cal-icon">
                <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 17.25z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="cal-btn-today" onClick={goToday}>Today</button>
            <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
            <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
            <span className="cal-header-label">{headerLabel()}</span>
          </div>

          <div className="topbar-center-calendarPage">
            <div className="cal-view-switcher">
              {["day","week","month","year"].map(v => (
                <button key={v} className={`cal-view-btn ${view === v ? "active" : ""}`}
                  onClick={() => setView(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="topbar-right-calendarPage">
            <div className="cal-search-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cal-search-icon">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
              </svg>
              <input
                className="cal-search"
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && searchResults.length > 0 && (
                <div className="cal-search-results">
                  {searchResults.map(e => (
                    <div key={e.id} className="cal-search-result" onClick={() => { handleEventClick(e); setSearch(""); }}>
                      <span className="cal-search-dot" style={{ backgroundColor: e.color }} />
                      <span>{e.title}</span>
                      <span className="cal-search-date">{MONTHS[e.date.getMonth()]} {e.date.getDate()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="cal-add-btn" onClick={() => setShowQuick(true)} title="Quick Add Event">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cal-icon">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Main Body ── */}
        <div className="body-calendarPage">

          {/* sidebar */}
          {showCalendarsPanel && (
            <aside className="sidebar-calendarPage">
              {/* mini calendar */}
              <div className="cal-mini-month">
                <div className="cal-mini-header">
                  <button className="cal-nav-btn-sm" onClick={() => navigate(-1)}>‹</button>
                  <span>{MONTHS[currentDate.getMonth()].slice(0,3)} {currentDate.getFullYear()}</span>
                  <button className="cal-nav-btn-sm" onClick={() => navigate(1)}>›</button>
                </div>
                <div className="cal-mini-dow-row">
                  {DAYS.map(d => <div key={d} className="cal-mini-dow">{d[0]}</div>)}
                </div>
                <div className="cal-mini-grid-full">
                  {(() => {
                    const y = currentDate.getFullYear(), m = currentDate.getMonth();
                    const fd = new Date(y, m, 1).getDay();
                    const nd = daysInMonth(y, m);
                    const cells = [];
                    for (let i = 0; i < fd; i++) cells.push(null);
                    for (let d = 1; d <= nd; d++) cells.push(d);
                    return cells.map((d, i) => {
                      if (!d) return <div key={i} />;
                      const dt = new Date(y, m, d);
                      const isTd = sameDay(dt, today());
                      const isCur = sameDay(dt, currentDate);
                      const hasEvt = filteredEvents.some(e => sameDay(e.date, dt));
                      return (
                        <div key={i}
                          className={`cal-mini-day-full ${isTd ? "today-circle" : ""} ${isCur && !isTd ? "selected-day" : ""} ${hasEvt ? "has-event" : ""}`}
                          onClick={() => { setCurrentDate(dt); if (view === "year" || view === "month") setView("month"); else setView("day"); }}>
                          {d}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* calendars list */}
              <div className="cal-calendars-section">
                <div className="cal-section-title">My Calendars</div>
                {calendars.map((c, i) => (
                  <div key={c.name} className="cal-calendar-row">
                    <label className="cal-calendar-check">
                      <input type="checkbox" checked={c.visible}
                        onChange={() => setCalendars(prev => prev.map((cc, ci) => ci === i ? { ...cc, visible: !cc.visible } : cc))} />
                      <span className="cal-check-color" style={{ backgroundColor: c.color }} />
                      <span className="cal-check-name">{c.name}</span>
                    </label>
                  </div>
                ))}
                <div className="cal-new-calendar">
                  <input className="cal-new-cal-input" placeholder="New calendar…"
                    value={newCalName} onChange={e => setNewCalName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCalendar()} />
                </div>
              </div>

              {/* upcoming events */}
              <div className="cal-upcoming-section">
                <div className="cal-section-title">Upcoming</div>
                {filteredEvents
                  .filter(e => e.date >= today())
                  .sort((a, b) => a.date - b.date)
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="cal-upcoming-item" onClick={() => handleEventClick(e)}>
                      <div className="cal-upcoming-dot" style={{ backgroundColor: e.color }} />
                      <div className="cal-upcoming-info">
                        <div className="cal-upcoming-title">{e.title}</div>
                        <div className="cal-upcoming-date">
                          {MONTHS[e.date.getMonth()].slice(0,3)} {e.date.getDate()}
                          {!e.allDay && ` · ${pad(e.date.getHours())}:${pad(e.date.getMinutes())}`}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </aside>
          )}

          {/* main view */}
          <main className="main-calendarPage">
            {view === "day" && (
              <DayView currentDate={currentDate} events={filteredEvents}
                onSlotClick={handleSlotClick} onEventClick={handleEventClick} />
            )}
            {view === "week" && (
              <WeekView currentDate={currentDate} events={filteredEvents}
                onSlotClick={handleSlotClick} onEventClick={handleEventClick} />
            )}
            {view === "month" && (
              <MonthView currentDate={currentDate} events={filteredEvents}
                onDayClick={handleDayClick} onEventClick={handleEventClick} />
            )}
            {view === "year" && (
              <YearView currentDate={currentDate} events={filteredEvents}
                onMonthClick={handleMonthClick} />
            )}
          </main>
        </div>
      </div>

      {/* modals */}
      {showModal && (
        <EventModal
          event={selectedEvent}
          calendars={calendars}
          onClose={() => { setShowModal(false); setSelectedEvent(null); }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
      {showQuick && (
        <QuickAdd
          onAdd={handleQuickAdd}
          onClose={() => setShowQuick(false)}
          defaultDate={currentDate}
        />
      )}
    </div>
  );
}

export default CalendarPage;