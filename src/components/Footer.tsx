
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
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="mt-4 md:order-1 md:mt-0">
          <p className="text-center text-sm leading-5 text-gray-300 mb-2">
            This tool is for informational purposes only and is not a substitute for professional medical advice.
            Always consult with a healthcare provider before making any changes to your medication regimen.
          </p>
          <div className="text-center space-x-4">
            <Link 
              to="/privacy-policy"
              className="text-sm text-gray-300 hover:text-white transition-colors duration-200 inline-block cursor-pointer"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms"
              className="text-sm text-gray-300 hover:text-white transition-colors duration-200 inline-block cursor-pointer"
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
