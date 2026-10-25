import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Dealers.css";
import "../assets/style.css";
import positive_icon from "../assets/positive.png";
import neutral_icon from "../assets/neutral.png";
import negative_icon from "../assets/negative.png";
import review_icon from "../assets/reviewbutton.png";
import Header from "../Header/Header";

const Dealer = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loadedReviews, setLoadedReviews] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dealerResponse, reviewResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch(`/djangoapp/reviews/dealer/${id}`)
        ]);
        const dealerData = await dealerResponse.json();
        const reviewData = await reviewResponse.json();

        if (!dealerResponse.ok || dealerData.status !== 200) {
          throw new Error(dealerData.error || "Unable to load dealership");
        }
        if (!reviewResponse.ok || reviewData.status !== 200) {
          throw new Error(reviewData.error || "Unable to load reviews");
        }

        const dealerRows = Array.isArray(dealerData.dealer) ? dealerData.dealer : [];
        setDealer(dealerRows[0] || {});
        setReviews(Array.isArray(reviewData.reviews) ? reviewData.reviews : []);
      } catch (err) {
        setError(err.message || "Unable to load dealership details");
      } finally {
        setLoadedReviews(true);
      }
    };
    load();
  }, [id]);

  const sentimentIcon = (sentiment) =>
    sentiment === "positive" ? positive_icon :
    sentiment === "negative" ? negative_icon : neutral_icon;

  return (
    <div style={{ margin: "20px" }}>
      <Header />
      {error && <p role="alert">{error}</p>}
      <div style={{ marginTop: "10px" }}>
        <h1 style={{ color: "grey" }}>
          {dealer.full_name}
          {sessionStorage.getItem("username") && (
            <a href={`/postreview/${id}`}>
              <img src={review_icon} style={{ width: "10%", marginLeft: "10px", marginTop: "10px" }} alt="Post Review" />
            </a>
          )}
        </h1>
        <h4 style={{ color: "grey" }}>
          {dealer.city}, {dealer.address}, Zip - {dealer.zip}, {dealer.state}
        </h4>
      </div>
      <div className="reviews_panel">
        {!loadedReviews ? (
          <p>Loading Reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet!</p>
        ) : (
          reviews.map((review) => (
            <div className="review_panel" key={review.id}>
              <img src={sentimentIcon(review.sentiment)} className="emotion_icon" alt={review.sentiment || "neutral"} />
              <div className="review">{review.review}</div>
              <div className="reviewer">
                {review.name} {review.car_make} {review.car_model} {review.car_year}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dealer;
