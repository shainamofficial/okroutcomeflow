import { LegalLayout } from "@/components/legal/LegalLayout";

const CONTACT_EMAIL = "hello@okroutcomeflow.com";

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="July 2026">
      <p>
        These Terms of Service ("Terms") govern your use of OutcomeFlow (the "Service"). By
        creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>1. The service</h2>
      <p>
        OutcomeFlow is an OKR management application for teams to plan objectives, track key
        results, and organize related work. We may add, change, or remove features over time.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the activity under your account and for keeping your credentials
        secure. You must provide accurate information and be at least 16 years old to use the
        Service.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service for anything unlawful or infringing;</li>
        <li>attempt to disrupt, overload, or gain unauthorized access to the Service;</li>
        <li>upload malware or content you don't have the right to share.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You retain ownership of the content you create. You grant us the limited rights needed to
        host, process, and display that content solely to operate the Service for you. You are
        responsible for the content you upload.
      </p>

      <h2>5. Availability</h2>
      <p>
        We work to keep the Service available and reliable, but it is provided "as is" without
        warranties of any kind. We do not guarantee uninterrupted or error-free operation.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we are not liable for any indirect, incidental, or
        consequential damages, or for loss of data or profits, arising from your use of the Service.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        terminate access if these Terms are violated.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms; material changes will be reflected by the "Last updated" date
        above. Continued use after changes means you accept the updated Terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <hr />
      <p>
        <em>
          This document is a general template and does not constitute legal advice. Review it with
          a qualified professional and add your company details and governing law before relying on
          it.
        </em>
      </p>
    </LegalLayout>
  );
}
