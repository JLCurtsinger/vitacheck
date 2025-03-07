
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavHeader from "@/components/NavHeader";

export default function Hero() {
  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <NavHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pt-40 md:pb-32">
        <div className="text-center md:text-left md:max-w-[650px]">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Check medication interactions safely
            </span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-gray-600 max-w-[550px] mx-auto md:mx-0">
            Verify potential interactions between your medications and supplements to ensure your safety and peace of mind.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/check">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 px-8 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] text-lg">
                Check Interactions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/experiences">
              <Button 
                variant="outline"
                className="w-full sm:w-auto border-2 border-blue-200 hover:border-blue-300 text-blue-600 font-medium py-6 px-8 rounded-xl hover:bg-blue-50 transition-all text-lg"
              >
                View Experiences
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute right-0 top-40 hidden lg:block">
        <div className="w-[450px] h-[450px] bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
      </div>
      
      <div className="absolute left-20 bottom-20 hidden lg:block">
        <div className="w-[350px] h-[350px] bg-purple-100 rounded-full opacity-30 blur-3xl"></div>
      </div>
    </div>
  );
}
