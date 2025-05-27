
import { useEffect } from "react";
import { HeroNavbar } from "./hero/HeroNavbar";
import HeroContent from "./hero/HeroContent";
import HeroBackground from "./hero/HeroBackground";

export default function Hero() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <HeroNavbar scrollToTop={scrollToTop} />
      <HeroBackground />
      <HeroContent />
    </div>
  );
}
