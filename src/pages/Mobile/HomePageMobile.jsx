import React, { useState, useEffect } from 'react';
import './HomePageMobile.css';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const HomePageMobile = () => {
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('');
  const [date, setDate] = useState('');

  document.title = 'Lancherix Studio';

  useEffect(() => {
    const tick = () => {
      const d   = new Date();
      const h24 = d.getHours();
      const h12 = h24 % 12 || 12;
      const min = String(d.getMinutes()).padStart(2, '0');
      setTime(`${h12}:${min}`);
      setAmpm(h24 >= 12 ? 'PM' : 'AM');
      setDate(`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hpm-root">
      <div className="hpm-clock-block">
        <h1 className="hpm-time">
          {time} <span className="hpm-ampm">{ampm}</span>
        </h1>
        <p className="hpm-date">{date}</p>
      </div>
    </div>
  );
};

export default HomePageMobile;