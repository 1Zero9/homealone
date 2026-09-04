import { LegalPageLayout } from '@/src/components/LegalPageLayout';
import { HELP_GUIDE_SECTIONS } from '@/src/data/helpGuide';
import { APP_VERSION } from '@/src/data/changelog';

export const metadata = {
  title: 'User Guide — Tally',
};

export default function GuidePage() {
  return (
    <LegalPageLayout title="User guide" lastUpdated={`v${APP_VERSION}`}>
      <p>
        A full walkthrough of everything you can do in Tally. This same content also powers the
        in-app Help guide and the &quot;Ask Tally&quot; assistant&apos;s answers to how-to
        questions, so it&apos;s always kept in sync with what the app can actually do.
      </p>
      <p>
        Looking for architecture, the data model, or the API reference instead? See the{' '}
        <a href="/technical-overview">Technical Overview</a>.
      </p>

      {HELP_GUIDE_SECTIONS.map((section) => (
        <div key={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      ))}
    </LegalPageLayout>
  );
}
