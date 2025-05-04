
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NavHeader() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // This component is now empty since the logout button has been moved
  // to the Hero component's navigation
  return null;
}
