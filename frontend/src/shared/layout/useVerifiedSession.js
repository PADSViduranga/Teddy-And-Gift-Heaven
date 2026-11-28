import { useEffect, useState } from "react";
import client from "../api/client";
import { getSession } from "../utils/session";

export default function useVerifiedSession() {
  const token = getSession()?.token;
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    client.get("/auth/me", { signal: controller.signal }).then(
      ({ data }) => {
        if (!controller.signal.aborted) setVerification({ token, account: data });
      },
      () => {
        if (!controller.signal.aborted) setVerification({ token, error: true });
      },
    );
    return () => controller.abort();
  }, [token]);

  if (!token) return {};
  if (verification?.token !== token) return { loading: true };
  return verification;
}
