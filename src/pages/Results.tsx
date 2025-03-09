
import Results from "@/components/Results";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function ResultsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Results />
      </main>
      <Footer />
    </div>
  );
}
