import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './HomePageMobile.css';

const HomePageMobile = () => {
  const { t } = useTranslation();
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('');
  const [date, setDate] = useState('');

  document.title = 'Lancherix Studio';

  useEffect(() => {
    const months = t('months', { returnObjects: true });

    const tick = () => {
      const d   = new Date();
      const h24 = d.getHours();
      const h12 = h24 % 12 || 12;
      const min = String(d.getMinutes()).padStart(2, '0');
      setTime(`${h12}:${min}`);
      setAmpm(h24 >= 12 ? 'PM' : 'AM');
      setDate(`${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [t]);

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