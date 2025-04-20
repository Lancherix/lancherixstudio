import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchItunesDataById } from './api/itunes';
import itunesLogo from '../icons/iTunes.png'
import './Styles/ItemDetails.css';

import UnmuteIcon from '../icons/unmute.svg';
import MuteIcon from '../icons/mute.svg';
import PlayerIcon from '../icons/player.svg';
import PauseIcon from '../icons/pause.svg'
import FullscreenIcon from '../icons/fullscreen.svg';

const ItemDetails = () => {
  const { kind, trackName, trackId } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = () => {
    setMuted(!muted);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const makeFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  useEffect(() => {
    const fetchItemDetails = async () => {
      setError(null);
      try {
        const data = await fetchItunesDataById(trackId);
        if (!data) {
          setError('Item not found.');
        } else {
          setItem(data);
        }
      } catch (error) {
        setError('An error occurred while fetching data.');
        console.error('Fetch error:', error);
      }
    };

    fetchItemDetails();
  }, [trackId]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!item) {
    return <p>Loading...</p>;
  }

  function itunesUrl() {
    window.open(item.trackViewUrl, '_blank');
  }

  return (
    <div className='background-video-container'>
      {kind === 'movie' || kind === 'tv-episode' ? (
        <div>
          <video ref={videoRef} className='preview background-video' width="320" height="240" autoPlay muted={muted} loop>
            <source src={item.previewUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="controls">
            <button className="mute-button" onClick={toggleMute}>
              {muted ? <img src={UnmuteIcon} className='controlIcon' /> : <img src={MuteIcon} className='controlIcon' />}
            </button>
            <button className="play-pause-button" onClick={togglePlayPause}>
              {videoRef.current && videoRef.current.paused ? <img src={PlayerIcon} className='controlIcon' /> : <img src={PlayerIcon} className='controlIcon' />}
            </button>
            <button className="fullscreen-button" onClick={makeFullScreen}>
              <img src={FullscreenIcon} className='controlIcon' />
            </button>
          </div>
        </div>
      ) : (
        <audio controls className='controls'>
          <source src={item.previewUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      <div className='all'>
        <div className='title'>
          <h1 className='trackName'>{item.trackName}</h1>
          <img className='itunesLogo' src={itunesLogo} onClick={itunesUrl} />
        </div>
        <div className='details'>
          <div className='contentLeft'>
            <div className='art'>
              <img src={item.artworkUrl100} alt={item.trackName} className='artWork' />
            </div>
            <div className='pricingBtns'>
              <button className='price' onClick={itunesUrl}>${item.trackPrice}</button>
            </div>
            <div className='rating'>
              <p className='country'>{item.country}</p>
              <p className='contentAdvisorRating'>{item.contentAdvisoryRating}</p>
            </div>
          </div>
          <div className='contentRight'>
            <div className='genderCont'>
              <h2 className='genre'>{item.primaryGenreName}</h2>
            </div>
            <div className='stats'>
              <p className='releaseDate'>{new Date(item.releaseDate).toLocaleDateString()}</p>
              <p> | </p>
              <p className='duration'>{Math.floor(item.trackTimeMillis / 60000)}:{('0' + Math.floor((item.trackTimeMillis % 60000) / 1000)).slice(-2)} minutes</p>
            </div>
            <div className='descriptionItem'>
              <p className='longDescription'>{item.longDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;