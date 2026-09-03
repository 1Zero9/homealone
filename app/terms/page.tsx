import { LegalPageLayout } from '@/src/components/LegalPageLayout';

export const metadata = {
  title: 'Terms & Disclaimer — Tally',
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service & Disclaimer" lastUpdated="September 3, 2026">
      <div className="ha-callout">
        <strong>This is a template, not legal advice.</strong> Sections marked{' '}
        <span className="ha-placeholder">like this</span> must be completed and this document
        reviewed by a qualified lawyer before you rely on it.
      </div>

      <h2>1. Acceptance of terms</h2>
      <p>
        By creating an account or using Tally (&quot;the Service&quot;), you agree to these Terms
        of Service. If you do not agree, please do not use the Service.
      </p>

      <h2>2. What Tally is — and isn&apos;t</h2>
      <p>
        Tally is a household budgeting and expense-tracking tool that helps you record, organise,
        and review your household&apos;s expenses and income, and optionally uses AI to answer
        questions about your data or draft vendor emails.
      </p>
      <p>
        <strong>Tally is not a financial, tax, legal, or investment adviser.</strong> Nothing in
        the app — including summaries, insights, or AI-generated responses — constitutes financial
        advice. Always verify important figures yourself and consult a qualified professional
        before making financial decisions.
      </p>

      <h2>3. AI-generated content</h2>
      <p>
        Tally&apos;s optional &quot;Ask Tally&quot; assistant and vendor email drafting feature use
        a third-party AI model (Google Gemini) to generate responses based on your household data.
        AI-generated content may be inaccurate, incomplete, or out of date. You are responsible for
        reviewing any AI-drafted content — including vendor emails — before acting on it or
        sending it. See our <a href="/ai-transparency">AI Transparency notice</a> for full details.
      </p>

      <h2>4. Your account and household</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>
          You are responsible for keeping your email account secure, since sign-in codes are sent
          there and anyone with access to your email can access your Tally account.
        </li>
        <li>
          Data within a household is shared and visible to all members of that household. Only
          invite people you trust with this information.
        </li>
        <li>
          Household admins can manage members and may be able to view or moderate household data.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose;</li>
        <li>Attempt to gain unauthorized access to another household&apos;s data or any account;</li>
        <li>Interfere with or disrupt the Service, including via automated abuse of sign-in codes;</li>
        <li>Use the AI features to generate deceptive, harmful, or abusive content.</li>
      </ul>

      <h2>6. Termination</h2>
      <p>
        You may stop using the Service and request account deletion at any time by contacting us
        at <span className="ha-placeholder">[contact email address]</span>. We may suspend or
        terminate accounts that violate these Terms.
      </p>

      <h2>7. Disclaimer of warranties</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties
        of any kind, express or implied, including fitness for a particular purpose,
        non-infringement, or that the Service will be uninterrupted, secure, or error-free.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law,{' '}
        <span className="ha-placeholder">[Legal entity / operator name]</span> shall not be liable
        for any indirect, incidental, or consequential damages, or for any financial decisions made
        based on data, summaries, or AI-generated content within the Service.
      </p>

      <h2>9. Age requirement</h2>
      <p>You must be at least 16 years old to use Tally.</p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. We&apos;ll update the &quot;Last
        updated&quot; date above when we do. Continued use of Tally after changes means you accept
        the revised Terms.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of{' '}
        <span className="ha-placeholder">[jurisdiction]</span>, without regard to conflict-of-law
        principles.
      </p>

      <h2>12. Contact us</h2>
      <p>
        Questions about these Terms? Contact{' '}
        <span className="ha-placeholder">[contact email address]</span>.
      </p>
    </LegalPageLayout>
  );
}
