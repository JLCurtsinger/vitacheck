import MedicationForm from "@/components/MedicationForm";
import Footer from "@/components/Footer";

export default function Check() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <MedicationForm />
      </main>
      <Footer />
    </div>
  );
}