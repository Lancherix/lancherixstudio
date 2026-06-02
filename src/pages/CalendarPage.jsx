import React, { useState, useRef, useEffect } from "react";
import "./Styles/CalendarPage.css";

function CalendarPage() {
  return (
    <div className="all-calendarPage">
      <div className="window-calendarPage">
        <aside className="panel-calendarPage">

        </aside>
        <section className="calendar-calendarPage">
          <div className="mainColumn-calendarPage">
            <div className="options-calendarPage">
              
            </div>
            <div className="grid-calendarPage">
              
            </div>

          </div>
          {/* ===== Hiddable right section ===== */}
          <aside className="rightPanel-calendarPage">

          </aside>
        </section>
      </div>
    </div>
  );
}

export default CalendarPage;