import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

export default function TermsAndConditions() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="absolute top-0 left-0 w-full p-4">
        <Link 
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-300"
          onClick={scrollToTop}
        >
          Vitacheck
        </Link>
      </div>
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 sm:p-10">
            <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Terms and Conditions for VitaCheck
            </h1>
            
            <div className="mb-8">
              <p className="text-sm text-gray-600">
                Effective Date: Feb. 16, 2025<br />
                Last Updated: Feb. 16, 2025
              </p>
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                Welcome to VitaCheck ("we," "our," or "us"). By accessing or using our website, you agree to be bound by these Terms and Conditions ("Terms").
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6 rounded-r-lg">
                <p className="text-yellow-800">
                  <strong>⚠️ Important Disclaimer:</strong> VitaCheck is an informational tool only and does not provide medical advice. The information presented on this site may be incomplete, inaccurate, or outdated. Always consult a licensed healthcare provider before making any medication or supplement decisions.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Acceptance of Terms</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                By using VitaCheck, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our website.
              </p>
              <p className="text-gray-800 leading-relaxed">
                We reserve the right to modify these Terms at any time. Your continued use of VitaCheck after any such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. No Medical Advice</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                VitaCheck does not provide medical advice, diagnosis, or treatment. The content on this website is for informational purposes only.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-800 leading-relaxed space-y-2">
                <li>Our interaction checker is not a substitute for professional medical advice.</li>
                <li>We do not guarantee the accuracy, completeness, or reliability of any information.</li>
                <li>Always consult with a qualified healthcare provider before starting, stopping, or changing any medication regimen.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Limitation of Liability</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                To the maximum extent permitted by law, VitaCheck and its operators, affiliates, and partners shall not be liable for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-800 leading-relaxed space-y-2">
                <li>Any direct, indirect, incidental, consequential, or punitive damages arising from your use of this website.</li>
                <li>Any harm resulting from reliance on information provided by VitaCheck.</li>
                <li>Any errors, omissions, or inaccuracies in the content.</li>
                <li>Any decision made or action taken based on the information provided.</li>
              </ul>
              <p className="text-gray-800 leading-relaxed">
                By using VitaCheck, you expressly agree that your use is at your sole risk.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Third-Party Content and Links</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                VitaCheck may contain links to third-party websites or content from external sources (including RxNorm, SUPP.AI, and other medical databases).
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-800 leading-relaxed space-y-2">
                <li>We do not control, endorse, or assume responsibility for any third-party content.</li>
                <li>The inclusion of any link does not imply our endorsement of the linked site.</li>
                <li>Use of third-party websites is subject to their terms and conditions.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Intellectual Property</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                All content on VitaCheck, including text, graphics, logos, and software, is the property of VitaCheck or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
              <p className="text-gray-800 leading-relaxed">
                You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. User Conduct</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                When using VitaCheck, you agree not to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-800 leading-relaxed space-y-2">
                <li>Use the website for any unlawful purpose.</li>
                <li>Attempt to gain unauthorized access to any part of the website.</li>
                <li>Interfere with the proper functioning of the website.</li>
                <li>Collect or harvest any information from the website.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Indemnification</h2>
              <p className="text-gray-800 leading-relaxed">
                You agree to indemnify, defend, and hold harmless VitaCheck, its operators, affiliates, and partners from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from your violation of these Terms or your use of the website.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Governing Law</h2>
              <p className="text-gray-800 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law principles.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Contact Information</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-800 leading-relaxed">
                📧 Admin@VitaCheck.cc<br />
                🌐 VitaCheck.cc
              </p>
            </section>

            <div className="bg-gray-50 p-6 rounded-xl mt-12 border border-gray-100">
              <p className="text-gray-800 leading-relaxed">
                By using VitaCheck, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you do not agree, please discontinue use immediately.
              </p>
              <p className="text-yellow-800 font-semibold mt-4 flex items-center gap-2">
                <span>⚠️</span> Always consult a licensed healthcare professional before making any medication decisions.
              </p>
              <p className="mt-4">
                Please also review our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline" onClick={scrollToTop}>Privacy Policy</Link> for information on how we handle data.
              </p>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
