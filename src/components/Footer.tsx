import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

/**
 * Handles scrolling to top of the page on route changes.
 */
function useScrollToTopOnNav() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);
}

export default function Footer() {
  useScrollToTopOnNav();

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-auto relative z-10">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-sm leading-5 text-gray-300 max-w-3xl">
            This tool is for informational purposes only and is not a substitute for professional medical advice.
            Always consult with a healthcare provider before making any changes to your medication regimen.
          </p>
          
          <nav className="flex items-center justify-center space-x-6">
            <Link 
              to="/privacy-policy"
              className="text-sm text-gray-300 hover:text-white transition-colors duration-200 relative z-20"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms"
              className="text-sm text-gray-300 hover:text-white transition-colors duration-200 relative z-20"
            >
              Terms and Conditions
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
