import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./Dealers.css";
import "../assets/style.css";
import Header from "../Header/Header";

const PostReview = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carModels, setCarModels] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [dealerResponse, carsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch("/djangoapp/get_cars")
        ]);
        const dealerData = await dealerResponse.json();
        const carsData = await carsResponse.json();

        if (!dealerResponse.ok || dealerData.status !== 200) {
          throw new Error(dealerData.error || "Unable to load dealership");
        }
        if (!carsResponse.ok) {
          throw new Error("Unable to load car models");
        }

        const dealers = Array.isArray(dealerData.dealer) ? dealerData.dealer : [];
        setDealer(dealers[0] || {});
        setCarModels(Array.isArray(carsData.CarModels) ? carsData.CarModels : []);
      } catch (err) {
        setMessage(err.message || "Unable to load the review form");
      }
    };
    load();
  }, [id]);

  const postReview = async (event) => {
    event.preventDefault();
    setMessage("");
    if (submittingRef.current) return;

    const username = sessionStorage.getItem("username") || "";
    const firstName = sessionStorage.getItem("firstname") || "";
    const lastName = sessionStorage.getItem("lastname") || "";
    const name = `${firstName} ${lastName}`.trim() || username;

    if (!username) {
      setMessage("Please log in before posting a review.");
      return;
    }
    if (!model || !review.trim() || !date || !year) {
      setMessage("All details are mandatory.");
      return;
    }

    const selected = carModels.find((car) => `${car.CarMake} ${car.CarModel}` === model);
    if (!selected) {
      setMessage("Please select a valid car model.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await fetch("/djangoapp/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dealership: Number(id),
          review: review.trim(),
          purchase: true,
          purchase_date: date,
          car_make: selected.CarMake,
          car_model: selected.CarModel,
          car_year: Number(year)
        })
      });

      const data = await response.json();
      if (!response.ok || data.status !== 200) {
        throw new Error(data.error || "Review could not be submitted.");
      }
      window.location.href = `/dealer/${id}`;
    } catch (err) {
      setMessage(err.message || "Review could not be submitted.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />
      <main style={{ margin: "5%" }}>
        <h1 style={{ color: "darkblue" }}>{dealer.full_name}</h1>
        <form onSubmit={postReview}>
          <label htmlFor="review">Your review</label>
          <textarea
            id="review"
            cols="50"
            rows="7"
            value={review}
            onChange={(event) => setReview(event.target.value)}
          />
          <div className="input_field">
            <label htmlFor="purchase-date">Purchase Date</label>
            <input id="purchase-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="input_field">
            <label htmlFor="cars">Car Make and Model</label>
            <select id="cars" value={model} onChange={(event) => setModel(event.target.value)}>
              <option value="">Choose Car Make and Model</option>
              {carModels.map((car) => {
                const value = `${car.CarMake} ${car.CarModel}`;
                return <option value={value} key={value}>{value}</option>;
              })}
            </select>
          </div>
          <div className="input_field">
            <label htmlFor="car-year">Car Year</label>
            <input
              id="car-year"
              type="number"
              min="2015"
              max="2023"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </div>
          <button className="postreview" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Post Review"}</button>
          {message && <p role="alert">{message}</p>}
        </form>
      </main>
    </div>
  );
};

export default PostReview;
