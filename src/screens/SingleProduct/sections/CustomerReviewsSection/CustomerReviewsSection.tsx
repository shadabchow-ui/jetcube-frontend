import { useProductPdp } from "../../../pdp/ProductPdpContext";

export function CustomerReviewsSection() {
  const product = useProductPdp();
  const reviews = product?.reviews;

  if (!reviews || (!reviews.items?.length && !reviews.average_rating)) {
    return null;
  }

  return (
    <section className="customer-reviews">
      <h3>Customer reviews</h3>

      {reviews.average_rating && reviews.count ? (
        <div className="review-summary">
          <strong>{reviews.average_rating.toFixed(1)}</strong>
          <span> / 5</span>
          <span style={{ marginLeft: 8 }}>
            ({reviews.count.toLocaleString()} reviews)
          </span>
        </div>
      ) : null}

      {reviews.items?.length ? (
        <ul className="review-list">
          {reviews.items.slice(0, 5).map((r: any, idx: number) => (
            <li key={idx} className="review-item">
              {r.rating ? (
                <div className="review-rating">
                  {"★".repeat(Math.round(r.rating))}
                </div>
              ) : null}
              {r.title ? <div className="review-title">{r.title}</div> : null}
              {r.body ? <div className="review-body">{r.body}</div> : null}
              {r.date ? <div className="review-date">{r.date}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

