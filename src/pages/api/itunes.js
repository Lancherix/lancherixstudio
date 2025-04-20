export const fetchItunesData = async (query) => {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${query}&limit=15`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};

export const fetchItunesDataById = async (id) => {
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.results[0];
  } catch (error) {
    console.error('Fetch by ID error:', error);
    throw new Error('An error occurred while fetching data by ID.');
  }
};