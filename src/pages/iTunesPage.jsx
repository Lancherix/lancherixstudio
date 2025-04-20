import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import { fetchItunesData } from './api/itunes';
import iTunesLogo from '../icons/iTunes.png';
import '../pages/Styles/iTunesPage.css';

const ITunesPage = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const bestMoviesArtists = [
    "The Shawshank Redemption",
    "The Godfather",
    "The Dark Knight",
    "Hunger Games",
    "Pulp Fiction",
    "The Lord of the Rings",
    "Schindler's List",
    "Inception",
    "Fight Club",
    "Forrest Gump",
    "The Matrix",
    "The Empire Strikes Back",
    "Rowan Atkinson",
    "Goodfellas",
    "Matthew Perry",
    "One Flew Over the Cuckoo's Nest",
    "Seven Samurai",
    "Se7en",
    "The Silence of the Lambs",
    "City of God",
    "Saving Private Ryan",
    "Interstellar",
    "Parasite",
    "The Green Mile",
    "Léon: The Professional",
    "The Usual Suspects",
    "Harakiri",
    "The Lion King",
    "Back to the Future",
    "Gladiator",
    "The Prestige",
    "Whiplash",
    "The Departed",
    "The Pianist",
    "Terminator 2: Judgment Day",
    "American History X",
    "Psycho",
    "City Lights",
    "Casablanca",
    "Modern Times",
    "The Intouchables",
    "Once Upon a Time in the West",
    "Rear Window",
    "The Lives of Others",
    "Coco",
    "Avengers: Endgame",
    "Alien",
    "The Shining",
    "Paths of Glory",
    "Harry Potter",
    "Django Unchained",
    "Spider-Man",
    "Coco",
    "Grave of the Fireflies",
    "Oldboy",
    "Princess Mononoke",
    "Aliens",
    "Your Name.",
    "Das Boot",
    "Braveheart",
    "Toy Story",
    "Batman",
    "The Great Dictator",
    "Amélie",
    "The Hunt",
    "3 Idiots",
    "Inglourious Basterds",
    "Memento",
    "The Dark Knight Rises",
    "Star Wars",
    "Avengers: Infinity War",
    "American Beauty",
    "A Clockwork Orange",
    "Taxi Driver",
    "Lawrence of Arabia",
    "Vertigo",
    "The Wolf of Wall Street",
    "Citizen Kane",
    "North by Northwest",
    "Singin' in the Rain",
    "The Elephant Man",
    "Full Metal Jacket",
    "Monty Python and the Holy Grail",
    "Requiem for a Dream",
    "2001: A Space Odyssey",
    "Indiana Jones",
    "The Big Lebowski",
    "Mad Max: Fury Road",
    "Blade Runner",
    "Eternal Sunshine of the Spotless Mind",
    "Joker",
    "The Truman Show",
    "The Sixth Sense",
    "Reservoir Dogs",
    "The Social Network",
    "Jurassic Park",
    "Lego",
    "Finding Nemo",
    "WALL·E",
    "Ratatouille",
    "Marlon Brando",
    "Al Pacino",
    "Robert De Niro",
    "Leonardo DiCaprio",
    "Tom Hanks",
    "Denzel Washington",
    "Morgan Freeman",
    "Jack Nicholson",
    "Anthony Hopkins",
    "Daniel Day-Lewis",
    "Johnny Depp",
    "Brad Pitt",
    "Christian Bale",
    "Matt Damon",
    "Edward Norton",
    "Sean Penn",
    "Will Smith",
    "Tom Cruise",
    "Russell Crowe",
    "George Clooney",
    "Philip Seymour Hoffman",
    "Robert Duvall",
    "Gene Hackman",
    "Gary Oldman",
    "Jeff Bridges",
    "Robin Williams",
    "Michael Caine",
    "Liam Neeson",
    "Harrison Ford",
    "Clint Eastwood",
    "Kevin Spacey",
    "Anthony Perkins",
    "Charlize Theron",
    "Kate Winslet",
    "Meryl Streep",
    "Natalie Portman",
    "Scarlett Johansson",
    "Julia Roberts",
    "Nicole Kidman",
    "Sandra Bullock",
    "Angelina Jolie",
    "Anne Hathaway",
    "Jennifer Lawrence",
    "Emma Stone",
    "Reese Witherspoon",
    "Amy Adams",
    "Cate Blanchett",
    "Michelle Williams",
    "Julianne Moore",
    "Helena Bonham Carter",
    "Helen Mirren",
    "Judi Dench",
    "Diane Keaton",
    "Frances McDormand",
    "Saoirse Ronan",
    "Viola Davis",
    "Jessica Chastain",
    "Glenn Close",
    "Sigourney Weaver",
    "Emily Blunt",
    "Rachel McAdams",
    "Keira Knightley",
    "Naomi Watts",
    "Emma Watson",
    "Maggie Smith",
    "Laura Dern",
    "Tilda Swinton",
    "Kathy Bates",
    "Sally Field",
    "Jane Fonda",
    "Bette Davis",
    "Ingrid Bergman",
    "Audrey Hepburn",
    "Elizabeth Taylor",
    "Marilyn Monroe",
    "Greta Garbo",
    "Grace Kelly",
    "Jodie Foster",
    "Jessica Lange",
    "Susan Sarandon",
    "Winona Ryder",
    "Halle Berry",
    "Cameron Diaz",
    "Eva Green",
    "Michelle Pfeiffer",
    "Rachel Weisz",
    "Kate Hudson",
    "Chiwetel Ejiofor",
    "Eddie Redmayne",
    "Christoph Waltz",
    "Idris Elba",
    "Hugh Jackman",
    "Joaquin Phoenix",
    "Ryan Gosling",
    "Jake Gyllenhaal",
    "Matthew McConaughey",
    "Benedict Cumberbatch",
    "Javier Bardem",
    "Mark Ruffalo",
    "Jeremy Renner",
    "Paul Rudd",
    "Chris Hemsworth",
    "Steve Carell",
    "Marisa Tomei"
  ];


  const getRandomMovieArtists = () => {
    const randomIndex = Math.floor(Math.random() * bestMoviesArtists.length);
    return bestMoviesArtists[randomIndex];
  };

  useEffect(() => {
    const randomMovieArtists = getRandomMovieArtists();
    handleSearch(randomMovieArtists);
  }, []);

  const handleSearch = async (query) => {
    setError(null);
    try {
      const data = await fetchItunesData(query);
      if (data.length === 0) {
        setError('No results found.');
      } else {
        setResults(data);
      }
    } catch (error) {
      setError('An error occurred while fetching data.');
      console.error('Fetch error:', error);
    }
  };

  const handleItemClick = (result) => {
    const { kind, trackName, trackId } = result;
    const urlKind = kind === 'feature-movie' ? 'movie' : kind;
    let formattedTrackName = trackName ? trackName.replace(/ /g, '-') : 'unnamed';
    formattedTrackName = formattedTrackName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();

    if (!formattedTrackName) {
      formattedTrackName = 'title';
    }

    navigate(`/itunes/${urlKind}/${encodeURIComponent(formattedTrackName)}/${trackId}`);
  };

  const renderResult = (result) => (
    <div
      key={result.trackId}
      style={{ margin: '20px 0' }}
      className='result'
      onClick={() => handleItemClick(result)}
    >
      <div className='artwork'>
        <img src={result.artworkUrl100} alt={result.trackName} style={{ border: '5px solid black' }} />
      </div>
      <div className='description'>
        <h2>{result.trackName || result.collectionName}</h2>
        <p>Artist: {result.artistName}</p>
        <p>Album: {result.collectionName}</p>
        <p>Genre: {result.primaryGenreName}</p>
        <p>Price: ${result.trackPrice}</p>
        <p>Release Date: {new Date(result.releaseDate).toLocaleDateString()}</p>
        <p>Duration: {Math.floor(result.trackTimeMillis / 60000)}:{('0' + Math.floor((result.trackTimeMillis % 60000) / 1000)).slice(-2)} minutes</p>
      </div>
      <div className='filmAudio'>
        {result.kind && (result.kind.includes('movie') || result.kind.includes('tv')) ? (
          <video width="320" height="240" controls>
            <source src={result.previewUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <audio controls>
            <source src={result.previewUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className='header'>
        <h1>iTunes</h1>
        <SearchBar onSearch={handleSearch} />
        <img src={iTunesLogo} alt="iTunes" className="logo" />
      </div>
      {error && <p>{error}</p>}
      <div>
        {results.map((result) => renderResult(result))}
      </div>
    </div>
  );
};

export default ITunesPage;