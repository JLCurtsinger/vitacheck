
import { Link } from "react-router-dom";

export default function TermsAndConditions() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-0 left-0 w-full p-4">
        <Link 
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-300"
          onClick={scrollToTop}
        >
          Vitacheck
        </Link>
      </div>
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold mb-8">Terms and Conditions for VitaCheck</h1>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Effective Date: February 6, 2025<br />
              Last Updated: February 6, 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to VitaCheck ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your use of the VitaCheck website and services. By accessing or using VitaCheck, you agree to be bound by these Terms. If you do not agree, please discontinue use immediately.
            </p>
            <p className="mb-4">
              VitaCheck provides general information on potential medication and supplement interactions but does not provide medical advice. Always consult a licensed healthcare professional before making any decisions related to medications or supplements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use of VitaCheck</h2>
            <p className="mb-4">
              You agree to use VitaCheck only for lawful and informational purposes. By using this site, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>VitaCheck is not a substitute for medical advice.</li>
              <li>The results displayed may contain errors, omissions, or outdated information and should not be solely relied upon.</li>
              <li>You assume all responsibility for decisions made based on the information provided.</li>
              <li>You will not misuse the service, including attempting to hack, disrupt, or scrape data from VitaCheck.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. No Medical Advice – Use at Your Own Risk</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="text-yellow-700">
                <strong>⚠️ VitaCheck does not provide medical advice.</strong> The site aggregates information from third-party medical databases (e.g., RxNorm, SUPP.AI, openFDA) and presents it for informational purposes only.
              </p>
            </div>
            <p className="mb-4">By using VitaCheck, you acknowledge that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>The information provided may be incomplete, inaccurate, or outdated.</li>
              <li>No tool can guarantee 100% accurate drug interaction warnings.</li>
              <li>You must consult a healthcare provider before making any medication decisions.</li>
            </ul>
            <p>If you experience a medical emergency, call 911 or contact a licensed healthcare provider immediately.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party API Use & Limitations</h2>
            <p className="mb-4">
              VitaCheck relies on external sources (e.g., RxNorm, SUPP.AI, openFDA) for medication data. We do not control or verify the accuracy of these sources.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>API data may be incomplete, inconsistent, or contain errors.</li>
              <li>Some medications or interactions may not be included due to database limitations.</li>
              <li>If VitaCheck fails to detect an interaction, consult a healthcare provider.</li>
            </ul>
            <p>We are not responsible for any inaccuracies in third-party data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              Under no circumstances shall VitaCheck, its developers, affiliates, or partners be liable for any direct, indirect, incidental, or consequential damages, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Personal injury, illness, or death resulting from reliance on VitaCheck data.</li>
              <li>Medical errors due to missing or incorrect interaction warnings.</li>
              <li>Decisions made based on VitaCheck results.</li>
            </ul>
            <p>
              By using VitaCheck, you agree to hold us harmless from any claims, damages, or legal disputes arising from the use of this tool.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. No Warranties</h2>
            <p className="mb-4">VitaCheck is provided "as is" and "as available" without any warranties, express or implied.</p>
            <p className="mb-4">We do not guarantee that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>The service will be error-free, uninterrupted, or fully accurate.</li>
              <li>All possible drug interactions will be detected.</li>
              <li>The site will be available 24/7 or free from disruptions.</li>
            </ul>
            <p>We reserve the right to modify or discontinue VitaCheck at any time without notice.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to These Terms</h2>
            <p>
              We may update these Terms periodically. If changes occur, the "Last Updated" date at the top of this page will be revised. Continued use of VitaCheck after updates constitutes acceptance of the changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p>
              These Terms are governed by the laws of The United States government and the state of Arizona, without regard to conflict of law principles. Any legal disputes arising from the use of VitaCheck shall be handled in the courts of the United States or Arizona.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
            <p className="mb-4">
              If you have any concerns or questions about these Terms, you may contact us at:
            </p>
            <p className="mb-4">
              📧 Admin@LessonLink.com<br />
              🌐 LessonLink.com
            </p>
          </section>

          <div className="bg-gray-50 p-4 rounded-lg mt-8">
            <p className="text-gray-700">
              By using VitaCheck, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you do not agree, please discontinue use immediately.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
