const API = process.env.REACT_APP_API_URL; // o import.meta.env.VITE_API_URL

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  return data;
}