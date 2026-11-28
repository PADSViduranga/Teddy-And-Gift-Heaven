import { useState } from "react";
import { Gift } from "lucide-react";

// Product photo with a soft pink box and a gift icon when there is no photo (or it fails to load).
export default function ProductPhoto({ src, alt, children }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="shop-photo">
      {children}
      {src && !broken
        ? <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} />
        : <Gift size={40} strokeWidth={1.5} aria-hidden="true" />}
    </div>
  );
}
