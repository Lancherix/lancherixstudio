import React, { useState, useRef, useEffect } from "react";
import "./Styles/CalendarPage.css";

function CalendarPage() {
  return (
    <div className="all-projectPage">
      <div className="window-projectPage">

        {/* ===== Sidebar ===== */}
        <aside className="menu-projectPage">

        </aside>

        {/* ===== Main Content ===== */}
        <section className="content-projectPage">
          {/* 🔑 Main column (folders on top, content below) */}
          <div className="mainColumn-projectPage">

            {/* ===== Folder Tabs ===== */}
            <div className="foldersBar-projectPage">
              
            </div>

            {/* ===== Work Area ===== */}
            <div className="workarea-projectPage">
              
            </div>

          </div>

        </section>
      </div>
    </div>
  );
}

export default CalendarPage;