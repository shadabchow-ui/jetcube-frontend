import { useParams } from 'react-router-dom';
import { useProductPdpIndex, R2_BASE } from '../pdp/ProductPdpContext';
import { useEffect, useState } from 'react';

export default function SingleProduct() {
  const { slug } = useParams<{ slug: string }>();
  const { pdpIndex, loading, error } = useProductPdpIndex();
  const [product, setProduct] = useState<any>(null);
  const [pdpError, setPdpError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !pdpIndex) return;

    const productPath = pdpIndex[slug]; // ex: products/batch-5/1-6-ratio-....json.gz
    if (!productPath) {
      setPdpError(`Slug not found in index: ${slug}`);
      return;
    }

    const url = `${R2_BASE}/${productPath}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`PDP fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then(setProduct)
      .catch((err) => {
        console.error('PDP load error:', err);
        setPdpError(err.message);
      });
  }, [slug, pdpIndex]);

  if (loading) return <div>Loading index…</div>;
  if (error) return <div>Index error: {error}</div>;
  if (pdpError) return <div>Product failed to load: {pdpError}</div>;
  if (!product) return <div>Loading product…</div>;

  return (
    <div>
      <h1>{product.title}</h1>
      <img src={product.image} />
      <pre>{JSON.stringify(product, null, 2)}</pre>
    </div>
  );
}

























