
import MedicationForm from "@/components/MedicationForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Check() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <MedicationForm />
      </main>
      <Footer />
    </div>
  );
}
