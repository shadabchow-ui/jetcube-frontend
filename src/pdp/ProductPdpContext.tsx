import React, { createContext, useContext, useEffect, useState } from 'react';

export const R2_BASE =
  'https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev';

type PdpIndex = Record<string, string>;

const ProductPdpContext = createContext<{
  pdpIndex: PdpIndex | null;
  loading: boolean;
  error: string | null;
}>({
  pdpIndex: null,
  loading: true,
  error: null,
});

export const ProductPdpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdpIndex, setPdpIndex] = useState<PdpIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${R2_BASE}/indexes/_index.json.gz`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Index fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        setPdpIndex(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Index load error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <ProductPdpContext.Provider value={{ pdpIndex, loading, error }}>
      {children}
    </ProductPdpContext.Provider>
  );
};

export const useProductPdpIndex = () => useContext(ProductPdpContext);












 













 





