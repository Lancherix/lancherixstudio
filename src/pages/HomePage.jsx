import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Styles/HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  document.title = `Lancherix Studio`;

  useEffect(() => {
    const updateTime = () => {
      let d = new Date();
      let hour = d.getHours();
      let min = d.getMinutes();
      let amOrPm = hour >= 12 ? 'PM' : 'AM';

      if (hour > 12) {
        hour = hour - 12;
      }

      if (min < 10) {
        min = '0' + min;
      }

      setCurrentTime(`${hour}:${min} ${amOrPm}`);
    };

    const updateDate = () => {
      const month = t('months', { returnObjects: true });
      let d = new Date();
      let monthNum = d.getMonth();
      let date = d.getDate();
      let year = d.getFullYear();

      setCurrentDate(`${month[monthNum]} ${date}, ${year}`);
    };

    const timeInterval = setInterval(updateTime, 1000);
    const dateInterval = setInterval(updateDate, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dateInterval);
    };
  }, []);

  return (
    <div className='allInAll-homePage'>
      <div className='main-homePage'>
        <div className='insideMain-homePage'>
          <h1 className="realTime-homePage">{currentTime}</h1>
          <p className="date-homePage">{currentDate}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;