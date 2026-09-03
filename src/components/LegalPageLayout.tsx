import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TallyLogo } from './TallyLogo';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--ha-paper)' }}>
      <header
        style={{
          borderBottom: '1px solid var(--ha-line)',
          backgroundColor: 'var(--ha-white)',
          padding: '1rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: 'var(--ha-ink)',
            }}
          >
            <TallyLogo size={26} />
            <span style={{ fontWeight: 700, fontFamily: 'var(--ha-font-display)' }}>Tally</span>
          </Link>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              color: 'var(--ha-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} />
            Back to app
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div
          style={{
            backgroundColor: 'var(--ha-white)',
            border: '1px solid var(--ha-line)',
            borderRadius: 'var(--ha-radius-lg)',
            boxShadow: 'var(--ha-shadow)',
            padding: '2.5rem',
          }}
        >
          <h1
            style={{
              fontSize: '1.9rem',
              fontWeight: 700,
              color: 'var(--ha-ink)',
              fontFamily: 'var(--ha-font-display)',
              letterSpacing: '-0.01em',
              marginBottom: '0.35rem',
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginBottom: '2rem' }}>
            Last updated: {lastUpdated}
          </p>

          <div className="ha-legal-content">{children}</div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            justifyContent: 'center',
            marginTop: '1.5rem',
            fontSize: '0.8rem',
          }}
        >
          <Link href="/privacy" style={{ color: 'var(--ha-muted)' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ color: 'var(--ha-muted)' }}>
            Terms &amp; Disclaimer
          </Link>
          <Link href="/ai-transparency" style={{ color: 'var(--ha-muted)' }}>
            AI Transparency
          </Link>
        </div>
      </main>

      <style>{`
        .ha-legal-content h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ha-ink);
          margin-top: 2rem;
          margin-bottom: 0.6rem;
          font-family: var(--ha-font-display);
        }
        .ha-legal-content h2:first-child {
          margin-top: 0;
        }
        .ha-legal-content h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--ha-ink);
          margin-top: 1.25rem;
          margin-bottom: 0.4rem;
        }
        .ha-legal-content p {
          font-size: 0.88rem;
          line-height: 1.65;
          color: var(--ha-ink);
          margin-bottom: 0.75rem;
        }
        .ha-legal-content ul {
          margin: 0 0 0.9rem 1.1rem;
          padding: 0;
        }
        .ha-legal-content li {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--ha-ink);
          margin-bottom: 0.4rem;
        }
        .ha-legal-content strong {
          color: var(--ha-ink);
        }
        .ha-legal-content a {
          color: var(--ha-blue);
        }
        .ha-legal-content .ha-placeholder {
          background-color: var(--ha-lime-tint);
          border: 1px dashed var(--ha-lime);
          border-radius: 4px;
          padding: 0 0.3rem;
        }
        .ha-legal-content .ha-callout {
          background-color: var(--ha-blue-light);
          border: 1px solid var(--ha-blue);
          border-radius: var(--ha-radius-sm);
          padding: 0.85rem 1rem;
          font-size: 0.85rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
};
