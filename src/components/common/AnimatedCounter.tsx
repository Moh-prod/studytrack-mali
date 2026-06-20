import { useState, useEffect, useRef } from "react";
import { Typography } from "@mui/material";

export default function AnimatedCounter({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  sx = {},
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <Typography component="span" sx={{ fontWeight: 800, ...sx }}>
      {prefix}
      {display}
      {suffix}
    </Typography>
  );
}
