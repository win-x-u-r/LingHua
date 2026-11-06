import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { onPageChange } from "@/lib/appUpdate";

/** Switches to a new LingHua version, if one is waiting, when someone moves to another page. */
const UpdateReady = () => {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onPageChange();
  }, [pathname]);

  return null;
};

export default UpdateReady;
