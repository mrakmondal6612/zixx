import React, { useState, useEffect } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { apiUrl } from "@/lib/api";

const Review = ({ productId, reviews }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userReviews, setUserReviews] = useState(reviews);

  useEffect(() => {
    setUserReviews(reviews);
  }, [reviews]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
        const response = await fetch(apiUrl(`/clients/reviews/product/${productId}`), {
        credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await response.json();
      setUserReviews([...userReviews, data]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Reviews</h2>
      <ul>
        {userReviews.map((review) => (
          <li key={review._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <img
              src={review.userId?.profile_pic || "/placeholder.svg"}
              alt={review.userId?.first_name || "User"}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #eee', background: '#fff' }}
            />
            <div>
              <p style={{ margin: 0 }}>
                {review.comment} ({review.rating}/5)
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                By {review.userId.first_name} {review.userId.last_name}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <StarRating rating={rating} onRatingChange={(rating) => setRating(rating)} />
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
};

export default Review;