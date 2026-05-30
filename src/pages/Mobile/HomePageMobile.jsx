import React, { useState, useEffect } from 'react';
import './HomePageMobile.css';

const GREETINGS = {
  night:   'Good night',
  morning: 'Good morning',
  noon:    'Good afternoon',
  evening: 'Good evening',
};

const getGreeting = (hour) => {
  if (hour >= 5  && hour < 12) return GREETINGS.morning;
  if (hour >= 12 && hour < 17) return GREETINGS.noon;
  if (hour >= 17 && hour < 21) return GREETINGS.evening;
  return GREETINGS.night;
};

const DAYS    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS  = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];

const HomePageMobile = () => {
  const [time, setTime]       = useState('');
  const [seconds, setSeconds] = useState('');
  const [ampm, setAmpm]       = useState('');
  const [date, setDate]       = useState('');
  const [day, setDay]         = useState('');
  const [greeting, setGreeting] = useState('');
  const [firstName, setFirstName] = useState('');
  const [progress, setProgress] = useState(0); // day progress 0–1

  document.title = 'Lancherix Studio';

  // Fetch user's first name
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const user = await res.json();
        setFirstName(user.firstName || '');
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const tick = () => {
      const d    = new Date();
      const h24  = d.getHours();
      const h12  = h24 % 12 || 12;
      const min  = String(d.getMinutes()).padStart(2, '0');
      const sec  = String(d.getSeconds()).padStart(2, '0');

      setTime(`${h12}:${min}`);
      setSeconds(sec);
      setAmpm(h24 >= 12 ? 'PM' : 'AM');
      setDate(`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
      setDay(DAYS[d.getDay()]);
      setGreeting(getGreeting(h24));

      // Fraction of the day elapsed (0 at midnight, 1 at next midnight)
      const totalSec = h24 * 3600 + d.getMinutes() * 60 + d.getSeconds();
      setProgress(totalSec / 86400);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Arc path for SVG day-progress ring
  const R    = 120;
  const cx   = 160;
  const cy   = 160;
  const circ = 2 * Math.PI * R;
  const dash = progress * circ;
  const gap  = circ - dash;

  return (
    <div className="hpm-root">

      {/* Ambient orb background */}
      <div className="hpm-orb hpm-orb--1" />
      <div className="hpm-orb hpm-orb--2" />

      {/* Greeting */}
      <div className="hpm-greeting">
        <span className="hpm-greeting-text">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </span>
      </div>

      {/* Clock card */}
      <div className="hpm-clock-wrap">
        {/* SVG progress ring */}
        <svg className="hpm-ring" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={circ / 4} /* start at top */
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
          {/* Dot at progress tip */}
          {progress > 0.01 && (
            <circle
              cx={cx + R * Math.cos((progress * 2 * Math.PI) - Math.PI / 2)}
              cy={cy + R * Math.sin((progress * 2 * Math.PI) - Math.PI / 2)}
              r="5"
              fill="white"
              opacity="0.7"
            />
          )}
        </svg>

        {/* Time */}
        <div className="hpm-clock-inner">
          <div className="hpm-time-row">
            <span className="hpm-time">{time}</span>
            <div className="hpm-time-meta">
              <span className="hpm-ampm">{ampm}</span>
              <span className="hpm-seconds">{seconds}</span>
            </div>
          </div>
          <p className="hpm-day">{day}</p>
          <p className="hpm-date">{date}</p>
        </div>
      </div>

      {/* Day progress bar */}
      <div className="hpm-progress-wrap">
        <div className="hpm-progress-label">
          <span>Day progress</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="hpm-progress-track">
          <div
            className="hpm-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default HomePageMobile;