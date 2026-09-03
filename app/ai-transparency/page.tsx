import { LegalPageLayout } from '@/src/components/LegalPageLayout';

export const metadata = {
  title: 'AI Transparency — Tally',
};

export default function AiTransparencyPage() {
  return (
    <LegalPageLayout title="AI Transparency Notice" lastUpdated="September 3, 2026">
      <div className="ha-callout">
        This notice explains how Tally uses AI, in line with transparency obligations such as the
        EU AI Act. It is a template and should be reviewed by a qualified lawyer, particularly if
        you offer Tally to users in the EU.
      </div>

      <h2>1. You are interacting with an AI system</h2>
      <p>
        Tally includes two optional features powered by Google&apos;s Gemini AI model:
      </p>
      <ul>
        <li>
          <strong>&quot;Ask Tally&quot;</strong> — a chat-style assistant that answers questions
          about your household&apos;s expenses and income.
        </li>
        <li>
          <strong>Vendor email drafting</strong> — generates a draft negotiation, cancellation, or
          inquiry email to a vendor, based on an expense&apos;s details.
        </li>
      </ul>
      <p>
        Any response or draft produced by these features is clearly presented within the relevant
        AI tool in the app and is AI-generated, not written by a human at Tally.
      </p>

      <h2>2. These features are optional and off by default</h2>
      <p>
        Both AI features require a server-side API key to be configured by an administrator. If it
        is not configured, the features are disabled and the rest of the app works normally. You
        must actively choose to open &quot;Ask Tally&quot; or request a vendor email draft — the AI
        is never triggered automatically or without your action.
      </p>

      <h2>3. What data is sent to the AI provider</h2>
      <h3>Ask Tally</h3>
      <p>When you ask a question, we send Google&apos;s Gemini API:</p>
      <ul>
        <li>The text of your question (capped at 500 characters).</li>
        <li>
          A summary of your household&apos;s expenses and income: name, amount, currency, billing
          cycle, category, renewal dates, payment method, usage rating, and whether each is active
          or variable.
        </li>
        <li>Aggregate totals (monthly income, monthly expenses, and net monthly balance).</li>
      </ul>
      <p>
        We deliberately do <strong>not</strong> send vendor email addresses or free-text notes to
        the AI for this feature.
      </p>
      <h3>Vendor email drafting</h3>
      <p>When you request a drafted vendor email, we send:</p>
      <ul>
        <li>The expense name, amount, currency, billing cycle, and contract end date.</li>
        <li>Your chosen intent (negotiate, cancel, or ask a question).</li>
        <li>Your name, so the draft can be signed appropriately.</li>
      </ul>
      <p>
        The vendor&apos;s email address is <strong>not</strong> sent to the AI — it is only used
        afterwards by Tally&apos;s own email sending code, if and when you choose to send the
        message.
      </p>

      <h2>4. Human oversight — nothing is sent automatically</h2>
      <p>
        Tally&apos;s vendor email feature is designed with a human always in the loop:
      </p>
      <ul>
        <li>The AI only ever produces a <strong>draft</strong> shown to you in the app.</li>
        <li>You can review, edit, or discard the draft entirely.</li>
        <li>
          An email is sent only when you explicitly click send, and it is sent with exactly the
          subject and body you approved — the AI has no ability to send email on its own, and the
          sending code path is entirely separate from the drafting code path.
        </li>
        <li>Replies from vendors go to your own email address, not to Tally or Google.</li>
      </ul>

      <h2>5. No automated decision-making with legal or significant effects</h2>
      <p>
        Tally&apos;s AI features do not make any automated decisions that produce legal effects or
        similarly significantly affect you. They only generate informational answers and draft
        text for your review. Automated contract-renewal reminder emails are generated using
        simple date-based rules, not AI, and are purely notifications — they don&apos;t take any
        action on your behalf.
      </p>

      <h2>6. Accuracy and limitations</h2>
      <p>
        AI-generated answers and drafts may be inaccurate, incomplete, or fail to reflect the full
        context of your situation. Always review AI output critically before relying on it or
        sending it to a third party. See our <a href="/terms">Terms of Service</a> for our full
        AI-content disclaimer.
      </p>

      <h2>7. Learn more</h2>
      <p>
        For details on how your data is stored and protected more broadly, see our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalPageLayout>
  );
}
