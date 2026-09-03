import { LegalPageLayout } from '@/src/components/LegalPageLayout';

export const metadata = {
  title: 'Privacy Policy — Tally',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="September 3, 2026">
      <div className="ha-callout">
        <strong>This is a template, not legal advice.</strong> Sections marked{' '}
        <span className="ha-placeholder">like this</span> must be filled in with your real legal
        entity, contact details, and jurisdiction, and the whole document should be reviewed by a
        qualified lawyer before you rely on it for GDPR or other legal compliance.
      </div>

      <h2>1. Who we are</h2>
      <p>
        Tally is a household budgeting and expense-tracking application. The data controller
        responsible for your personal data is{' '}
        <span className="ha-placeholder">[Legal entity / operator name]</span>, contactable at{' '}
        <span className="ha-placeholder">[contact email address]</span>.
      </p>

      <h2>2. Data we collect</h2>
      <h3>Account data</h3>
      <ul>
        <li>Your name and email address, provided when you sign up or sign in.</li>
        <li>
          Your role within your household (Admin, Backup Admin, or Member) and an optional avatar
          image.
        </li>
        <li>A household name and invite code, if you create or join a household.</li>
      </ul>
      <h3>Financial data you enter</h3>
      <ul>
        <li>
          Expense records: name, amount, currency, billing cycle, category, renewal dates, payment
          method, notes, contract end dates, and an optional vendor email address.
        </li>
        <li>Income records: name, amount, currency, and frequency.</li>
        <li>
          Snapshots of your household&apos;s data created when an admin exports or backs up the
          household ledger.
        </li>
      </ul>
      <h3>Authentication data</h3>
      <ul>
        <li>
          A short-lived, single-use 6-digit verification code sent to your email address, used to
          sign in without a password.
        </li>
        <li>
          A session token stored in an <strong>httpOnly, secure</strong> cookie
          (<code>homealone_session</code>) once you&apos;re signed in, valid for up to 30 days.
        </li>
        <li>
          A copy of your basic profile (name, email, role) cached in your browser&apos;s local
          storage so the app can display your details instantly on return visits. This is not
          sent to any third party and is cleared when you sign out or clear your browser data.
        </li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To create and secure your account, and to authenticate you via email-code sign-in.</li>
        <li>
          To provide the core budgeting features: recording, displaying, and summarizing your
          household&apos;s expenses and income.
        </li>
        <li>
          To power the optional <strong>&quot;Ask Tally&quot;</strong> AI assistant and vendor
          email drafting features — see our{' '}
          <a href="/ai-transparency">AI Transparency notice</a> for full details of what is sent
          to our AI provider.
        </li>
        <li>
          To send transactional emails: sign-in codes, workspace invites, contract-renewal
          reminders, and vendor emails that you explicitly choose to send.
        </li>
        <li>To maintain backups of household data for disaster recovery purposes.</li>
      </ul>

      <h2>4. Legal bases for processing (GDPR Art. 6)</h2>
      <ul>
        <li>
          <strong>Contract</strong> — processing your account and financial data is necessary to
          provide the Tally service you&apos;ve signed up for.
        </li>
        <li>
          <strong>Legitimate interests</strong> — sending automated contract-renewal reminders and
          maintaining backups, so you don&apos;t miss a renewal or lose your data.
        </li>
        <li>
          <strong>Consent</strong> — where you choose to use the optional AI assistant or send a
          vendor email; these features are off by default until configured and are only triggered
          by your own action.
        </li>
      </ul>

      <h2>5. Who we share data with</h2>
      <p>Tally uses a small number of third-party service providers (&quot;subprocessors&quot;) to operate:</p>
      <ul>
        <li>
          <strong>Google (Gemini API)</strong> — receives your question text and relevant household
          expense/income summaries only when you actively use the &quot;Ask Tally&quot; assistant
          or ask it to draft a vendor email. See the{' '}
          <a href="/ai-transparency">AI Transparency notice</a> for exactly what fields are sent.
        </li>
        <li>
          <strong>Resend</strong> — our transactional email provider, used to deliver sign-in
          codes, invites, contract reminders, and vendor emails you send.
        </li>
        <li>
          <strong>Database hosting provider</strong> (<span className="ha-placeholder">[e.g. Neon / Vercel Postgres / Supabase]</span>) —
          stores your account and household data in a Postgres database.
        </li>
        <li>
          <strong>Hosting provider</strong> (<span className="ha-placeholder">[e.g. Vercel]</span>) —
          hosts the application and runs the scheduled reminder job.
        </li>
      </ul>
      <p>
        We do not sell your personal data, and we do not use any advertising or analytics
        trackers on this site.
      </p>

      <h2>6. International data transfers</h2>
      <p>
        Some of our subprocessors (for example Google) may process data outside your country of
        residence, including in the United States. Where this occurs, we rely on the
        subprocessor&apos;s standard contractual clauses or equivalent safeguards recognized under
        GDPR Chapter V. <span className="ha-placeholder">[Confirm and name the specific transfer mechanism used for each subprocessor.]</span>
      </p>

      <h2>7. Data retention</h2>
      <p>
        We retain your account and household data for as long as your account remains active.
        Verification codes expire and are deleted automatically after use or after 15 minutes,
        whichever comes first. Session tokens expire automatically after 30 days. Backup
        snapshots are retained until an administrator deletes them. If you close your account, we
        will delete or anonymize your personal data within{' '}
        <span className="ha-placeholder">[X days]</span>, except where we are required to keep it
        for legal or accounting reasons.
      </p>

      <h2>8. Your rights (GDPR)</h2>
      <p>If you are located in the UK/EEA, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you;</li>
        <li>Correct inaccurate or incomplete data;</li>
        <li>Request erasure of your data (&quot;right to be forgotten&quot;);</li>
        <li>Request a portable copy of your data;</li>
        <li>Restrict or object to certain processing;</li>
        <li>Withdraw consent at any time, where processing is based on consent;</li>
        <li>Lodge a complaint with your local data protection supervisory authority.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{' '}
        <span className="ha-placeholder">[contact email address]</span>. We will respond within
        one month as required by GDPR.
      </p>

      <h2>9. Security</h2>
      <p>
        We use industry-standard measures to protect your data, including encrypted connections
        (HTTPS), httpOnly/secure session cookies, single-use time-limited sign-in codes instead of
        stored passwords, and household-scoped data access controls. No system is 100% secure, and
        we encourage you to keep your email account secure since it is the key to signing in.
      </p>

      <h2>10. Children&apos;s privacy</h2>
      <p>
        Tally is not directed at children and is not intended for use by anyone under the age of
        16. We do not knowingly collect data from children.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We&apos;ll update the &quot;Last
        updated&quot; date above when we do. Continued use of Tally after changes means you accept
        the revised policy.
      </p>

      <h2>12. Contact us</h2>
      <p>
        Questions about this policy or your data? Contact{' '}
        <span className="ha-placeholder">[contact email address]</span>.
      </p>
    </LegalPageLayout>
  );
}
