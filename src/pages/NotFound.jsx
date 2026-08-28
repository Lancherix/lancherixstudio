import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Styles/NotFound.css';

const NotFound = () => {
  const { t } = useTranslation();

  document.title = `Lancherix`;

  return (
    <div className="not-found">
      <h1>{t('notFoundTitle')}</h1>
      <p>{t('notFoundMessage')}</p>
      <Link to="/">{t('backToHome')}</Link>
    </div>
  );
};

export default NotFound;