
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <main>
        <Hero />
      </main>
      {/* On mobile, reduce any excess top space before the footer */}
      <div className="mt-0 sm:mt-0">
        <Footer />
      </div>
    </div>
  );
}
