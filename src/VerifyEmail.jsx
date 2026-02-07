import { useEffect, useState } from "react";
import { api } from "./api";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    api(`/auth/verify?token=${token}`)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err?.message || "Verification failed. The link may be expired."
        );
      });
  }, []);

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "120px auto",
        padding: 28,
        borderRadius: 14,
        background: "#fff",
        boxShadow: "0 12px 35px rgba(0,0,0,0.15)",
        textAlign: "center",
      }}
    >
      <h1>Orbit Rentals</h1>

      {status === "loading" && <p>Verifying your email…</p>}

      {status === "success" && (
        <>
          <p style={{ color: "green", fontWeight: 600 }}>{message}</p>
          <button
            onClick={() => (window.location.href = "/")}
            style={button}
          >
            Go to Login
          </button>
        </>
      )}

      {status === "error" && (
        <p style={{ color: "red", fontWeight: 600 }}>{message}</p>
      )}
    </div>
  );
}

const button = {
  marginTop: 20,
  width: "100%",
  padding: 12,
  borderRadius: 6,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};
