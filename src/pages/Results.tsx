import Results from "@/components/Results";
import Footer from "@/components/Footer";

export default function ResultsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Results />
      </main>
      <Footer />
    </div>
  );
}