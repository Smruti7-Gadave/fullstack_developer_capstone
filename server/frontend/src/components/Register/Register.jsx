import React, { useState } from "react";
import "./Register.css";
import Header from "../Header/Header";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        window.location.origin + "/djangoapp/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName,
            firstName,
            lastName,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || data.error || "Registration failed.");
        return;
      }

      setMessage(data.message || "Registration successful. You can now log in.");
    } catch (error) {
      setMessage("Unable to reach the registration service. Please try again.");
    }
  };

  return (
    <div>
      <Header />
      <main className="register_container">
        <h1 className="header">Sign-up</h1>

        <form onSubmit={handleRegister}>
          <div className="inputs">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              className="input_field"
              type="text"
              name="username"
              placeholder="Enter username"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="register-first-name">First Name</label>
            <input
              id="register-first-name"
              className="input_field"
              type="text"
              name="firstName"
              placeholder="Enter first name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />

            <label htmlFor="register-last-name">Last Name</label>
            <input
              id="register-last-name"
              className="input_field"
              type="text"
              name="lastName"
              placeholder="Enter last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className="input_field"
              type="email"
              name="email"
              placeholder="Enter email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className="input_field"
              type="password"
              name="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="submit_panel">
            <button className="submit" type="submit">
              Register
            </button>
          </div>

          {message && <p role="status" aria-live="polite">{message}</p>}
        </form>
      </main>
    </div>
  );
};

export default Register;
