import { useEffect, useState } from "react";

// Loads data for a page and keeps loading / error state in one place.
export default function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    loader()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.response?.status === 401 || e.response?.status === 403
        ? "You don't have access to this data. Log in with the right role."
        : "Couldn't load the data. Is the backend running?"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading };
}
