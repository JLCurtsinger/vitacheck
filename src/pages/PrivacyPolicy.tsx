
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-8">Privacy Policy for VitaCheck</h1>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Effective Date: February 6, 2025<br />
              Last Updated: February 6, 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to VitaCheck ("we," "our," or "us"). VitaCheck is a free online tool designed to provide general information about potential interactions between medications and supplements.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="text-yellow-700">
                <strong>⚠️ Important Disclaimer:</strong> VitaCheck is not a substitute for professional medical advice, diagnosis, or treatment. The information provided by VitaCheck may contain errors, omissions, or outdated information. You must consult a licensed healthcare provider before making any decisions regarding your medications or supplements.
              </p>
            </div>
            <p>
              By using VitaCheck, you acknowledge and agree that we are not liable for any harm, injury, or death resulting from reliance on information provided by this website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="mb-4">
              VitaCheck does not require users to create an account or submit personal identifying information. However, we may collect limited non-personal data to improve our service:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Medication & Supplement Queries: When you enter a medication or supplement name, we process this data to retrieve interaction information.</li>
              <li>Analytics & Usage Data: We may collect anonymized usage data (e.g., page visits, queries, error reports) to enhance site functionality.</li>
              <li>Cookies: We may use cookies to improve user experience, but we do not track personal data.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Information</h2>
            <p className="mb-4">
              VitaCheck processes medication and supplement queries to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Retrieve potential interaction information from third-party APIs (RxNorm, SUPP.AI, openFDA, etc.).</li>
              <li>Display potential risk levels based on available data.</li>
              <li>Improve the accuracy and functionality of our platform.</li>
            </ul>
            <p>
              We do not sell, share, or store user queries for any marketing or commercial purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party APIs & Limitations</h2>
            <p className="mb-4">
              VitaCheck relies on external sources (e.g., RxNorm, SUPP.AI, openFDA) to retrieve medication interaction data. We do not control or verify the accuracy of these sources.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Information from these APIs may be incomplete, inaccurate, or outdated.</li>
              <li>API errors or limitations may result in missing or incorrect interaction warnings.</li>
              <li>Some interactions may not be detected due to gaps in available medical data.</li>
            </ul>
            <p>
              If VitaCheck fails to detect a known interaction, you must consult a healthcare professional immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. No Medical Advice – Use at Your Own Risk</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="text-yellow-700">
                <strong>⚠️ VitaCheck does not provide medical advice, nor does it replace professional healthcare consultation.</strong>
              </p>
            </div>
            <p className="mb-4">By using VitaCheck, you understand and agree that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>The results may be incorrect, incomplete, or misleading.</li>
              <li>We do not guarantee that all dangerous drug interactions will be detected.</li>
              <li>You must not make medication decisions based solely on information from VitaCheck.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="mb-4">
              Under no circumstances shall VitaCheck, its developers, affiliates, or partners be liable for any direct, indirect, incidental, or consequential damages, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Personal injury, illness, or death caused by reliance on our data.</li>
              <li>Medical errors due to incomplete or incorrect interaction information.</li>
              <li>Missed interactions that were not flagged due to API limitations.</li>
              <li>Losses resulting from inaccurate or outdated information.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Security Measures</h2>
            <p className="mb-4">
              We take reasonable precautions to protect your information, but no website is 100% secure.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>VitaCheck does not store sensitive medical data.</li>
              <li>We do not collect personally identifiable information.</li>
              <li>We use standard security protocols to protect user queries.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If changes occur, the "Last Updated" date at the top of this page will be revised. Continued use of VitaCheck after policy updates constitutes acceptance of the changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
            <p className="mb-4">
              If you have any concerns or questions about this Privacy Policy, you may contact us at:
            </p>
            <p className="mb-4">
              📧 Admin@LessonLink.com<br />
              🌐 LessonLink.com
            </p>
          </section>

          <div className="bg-gray-50 p-4 rounded-lg mt-8">
            <p className="text-gray-700">
              By using VitaCheck, you acknowledge that you have read, understood, and agreed to this Privacy Policy. If you do not agree, please discontinue use immediately.
            </p>
            <p className="text-yellow-700 font-bold mt-4">
              ⚠️ Always consult a licensed healthcare professional before making any medication decisions.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
