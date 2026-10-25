import React, { useEffect, useState } from "react";
import "./Dealers.css";
import "../assets/style.css";
import Header from "../Header/Header";
import review_icon from "../assets/reviewicon.png";

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);
  const [error, setError] = useState("");

  const get_dealers = async () => {
    try {
      setError("");
      const response = await fetch("/djangoapp/get_dealers");
      const data = await response.json();
      if (!response.ok || data.status !== 200) {
        throw new Error(data.error || "Unable to load dealerships");
      }
      const dealers = Array.isArray(data.dealers) ? data.dealers : [];
      setDealersList(dealers);
      setStates([...new Set(dealers.map((dealer) => dealer.state).filter(Boolean))].sort());
    } catch (err) {
      setError(err.message || "Unable to load dealerships");
    }
  };

  const filterDealers = async (state) => {
    try {
      setError("");
      const endpoint = state === "All"
        ? "/djangoapp/get_dealers"
        : `/djangoapp/get_dealers/${encodeURIComponent(state)}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok || data.status !== 200) {
        throw new Error(data.error || "Unable to filter dealerships");
      }
      setDealersList(Array.isArray(data.dealers) ? data.dealers : []);
    } catch (err) {
      setError(err.message || "Unable to filter dealerships");
    }
  };

  useEffect(() => {
    get_dealers();
  }, []);

  const isLoggedIn = Boolean(sessionStorage.getItem("username"));

  return (
    <div>
      <Header />
      {error && <p role="alert">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Dealer Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Zip</th>
            <th>
              <select
                name="state"
                id="state"
                defaultValue=""
                onChange={(event) => filterDealers(event.target.value)}
              >
                <option value="" disabled>State</option>
                <option value="All">All States</option>
                {states.map((state) => (
                  <option value={state} key={state}>{state}</option>
                ))}
              </select>
            </th>
            {isLoggedIn && <th>Review Dealer</th>}
          </tr>
        </thead>
        <tbody>
          {dealersList.map((dealer) => (
            <tr key={dealer.id}>
              <td>{dealer.id}</td>
              <td><a href={`/dealer/${dealer.id}`}>{dealer.full_name}</a></td>
              <td>{dealer.city}</td>
              <td>{dealer.address}</td>
              <td>{dealer.zip}</td>
              <td>{dealer.state}</td>
              {isLoggedIn && (
                <td>
                  <a href={`/postreview/${dealer.id}`}>
                    <img src={review_icon} className="review_icon" alt="Post Review" />
                  </a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dealers;
