
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
