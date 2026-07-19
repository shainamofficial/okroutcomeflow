import { LegalLayout } from "@/components/legal/LegalLayout";

const CONTACT_EMAIL = "hello@okroutcomeflow.com";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 2026">
      <p>
        This Privacy Policy explains what information OutcomeFlow ("we", "us") collects when you
        use our OKR management application, how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> — your name and email address, provided when you
          sign up with an email and password or with Google.
        </li>
        <li>
          <strong>Content you create</strong> — objectives, key results, initiatives, tasks,
          updates, reviews, and any files you upload to your organization's workspace.
        </li>
        <li>
          <strong>Technical data</strong> — a session cookie used to keep you signed in, and basic
          request logs (such as IP address) used to operate and secure the service.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To provide, maintain, and improve the service.</li>
        <li>To authenticate you and keep your account secure.</li>
        <li>To send transactional emails you request, such as password resets.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for advertising.</p>

      <h2>Where your data is stored</h2>
      <p>
        Your data is stored on infrastructure we control: a PostgreSQL database and object storage
        for uploaded files. Data is encrypted in transit (HTTPS/TLS). We retain your data for as
        long as your account is active.
      </p>

      <h2>Service providers</h2>
      <p>We rely on a small number of third parties to run the service:</p>
      <ul>
        <li><strong>Google</strong> — optional sign-in (OAuth).</li>
        <li><strong>Resend</strong> — sending transactional email.</li>
        <li><strong>Cloudflare</strong> — web hosting, object storage, and DNS.</li>
        <li><strong>Railway</strong> — hosting the application backend.</li>
        <li><strong>Supabase</strong> — managed PostgreSQL database hosting.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use a single essential cookie to keep you signed in. We do not use tracking or
        advertising cookies.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by contacting
        us. Deleting your account removes your personal information and content from our systems.
      </p>

      <h2>Children</h2>
      <p>The service is not directed to children under 16, and we do not knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected by the
        "Last updated" date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <hr />
      <p>
        <em>
          This document is a general template and does not constitute legal advice. Review it with
          a qualified professional and tailor it to your jurisdiction before relying on it.
        </em>
      </p>
    </LegalLayout>
  );
}
