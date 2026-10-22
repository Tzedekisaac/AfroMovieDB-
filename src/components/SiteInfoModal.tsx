import React, { useEffect, useRef } from 'react';
import { Film, X } from 'lucide-react';

export type SiteInfoPage = 'about' | 'contact' | 'privacy' | 'terms' | 'dmca';

interface SiteInfoModalProps {
  page: SiteInfoPage | null;
  onClose: () => void;
  onOpenAddFilm: () => void;
}

const modalTitles: Record<SiteInfoPage, string> = {
  about: 'About Us',
  contact: 'Contact Us',
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
  dmca: 'DMCA Notice'
};

export const SiteInfoModal: React.FC<SiteInfoModalProps> = ({ page, onClose, onOpenAddFilm }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!page) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [page, onClose]);

  if (!page) return null;

  const openAddFilm = () => {
    onClose();
    onOpenAddFilm();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-info-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0e131d] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/90 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Film className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="site-info-modal-title" className="font-cinema text-lg font-bold tracking-wide text-white sm:text-xl">
                {modalTitles[page]}
              </h2>
              <p className="text-xs text-slate-400">NaijaReel</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${modalTitles[page]}`}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm leading-relaxed text-slate-300 sm:p-7">
          {page === 'about' && (
            <p>
              Welcome to NaijaReel — the definitive digital home for Nigerian and continental African cinema. Our mission is to preserve, celebrate, and showcase the rich heritage of Nollywood—from classic 1990s VHS masterpieces to the blockbuster hits of today. Built by film lovers for film lovers, NaijaReel provides comprehensive film archives, cast lists, ratings, multi-status watchlists, and real-time community discovery.
            </p>
          )}

          {page === 'contact' && (
            <>
              <h3 className="text-base font-bold text-white">Get in Touch with the NaijaReel Team</h3>
              <p>Have a question, found a bug, or want to request a movie addition? We’d love to hear from you.</p>
              <ul className="list-disc space-y-3 pl-5 marker:text-emerald-400">
                <li>
                  <strong className="text-white">Support Email:</strong>{' '}
                  <a
                    href="mailto:tzedekisaac.dev@gmail.com"
                    className="break-all text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-300"
                  >
                    tzedekisaac.dev@gmail.com
                  </a>
                </li>
                <li>
                  <strong className="text-white">Community Submissions:</strong>{' '}
                  Use the{' '}
                  <button
                    type="button"
                    onClick={openAddFilm}
                    className="font-semibold text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-300"
                  >
                    '+ Add Film'
                  </button>{' '}
                  button directly in the navigation bar to contribute new releases to our global database.
                </li>
              </ul>
            </>
          )}

          {page === 'privacy' && (
            <>
              <h3 className="text-base font-bold text-white">Your Privacy Matters</h3>
              <p>
                At NaijaReel, we respect your privacy. When you sign in via Firebase authentication, we store your account profile info (name, email, avatar) and your personal watchlist/review history solely to sync your data across your devices.
              </p>
              <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
                <li>We never sell or share your personal data with third parties.</li>
                <li>We use secure local storage and Firebase security rules to protect your information.</li>
              </ul>
            </>
          )}

          {page === 'terms' && (
            <>
              <h3 className="text-base font-bold text-white">Platform Rules &amp; Guidelines</h3>
              <p>By accessing NaijaReel, you agree to use the platform responsibly:</p>
              <ul className="list-disc space-y-3 pl-5 marker:text-emerald-400">
                <li>Movie data and metadata are powered by TMDb and community contributions for informational and entertainment purposes.</li>
                <li>
                  Users submitting custom movies or reviews must keep content respectful, accurate, and free of spam or abusive language. NaijaReel reserves the right to moderate or remove violating submissions.
                </li>
              </ul>
            </>
          )}

          {page === 'dmca' && (
            <>
              <h3 className="text-base font-bold text-white">Copyright &amp; DMCA Compliance</h3>
              <p>
                NaijaReel respects the intellectual property rights of filmmakers, studios, and copyright holders. All movie posters, titles, and media data are indexed for identification and educational cataloging purposes via TMDb.
              </p>
              <ul className="list-disc pl-5 marker:text-emerald-400">
                <li>
                  If you are a copyright owner and believe your material has been improperly indexed or displayed, please submit a DMCA Takedown Notice to our copyright agent at{' '}
                  <a
                    href="mailto:tzedekisaac.dev@gmail.com"
                    className="break-all text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-300"
                  >
                    tzedekisaac.dev@gmail.com
                  </a>{' '}
                  including the title URL and proof of ownership, and we will promptly review and remove the content.
                </li>
              </ul>
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-800 bg-slate-900/70 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
