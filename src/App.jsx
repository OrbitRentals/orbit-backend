import VerifyEmail from "./VerifyEmail";
import { useState, useEffect } from "react";
import { api } from "./api";
import Admin from "./Admin";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  async function login() {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      setLoggedIn(true);
      loadVehicles();
    }
  }

  async function loadVehicles() {
    const data = await api("/vehicles");
    setVehicles(data);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLoggedIn(true);
      loadVehicles();
    }
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Orbit Rentals</h1>

      {!loggedIn && (
        <>
          <input
            placeholder="email"
            onChange={e => setEmail(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="password"
            onChange={e => setPassword(e.target.value)}
          />
          <br />
          <button onClick={login}>Login</button>
        </>
      )}

      {loggedIn && (
        <>
          <h3>Available Vehicles</h3>
          <ul>
            {vehicles.map(v => (
              <li key={v.id}>
                {v.year} {v.make} {v.model} — ${v.dailyPrice}/day
              </li>
            ))}
          </ul>

          <hr />
          <Admin />
        </>
      )}
    </div>
  );
}
