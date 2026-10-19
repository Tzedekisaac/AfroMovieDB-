import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle, Twitter, Facebook, X } from 'lucide-react';

interface SharePopoverProps {
  movieTitle: string;
  movieId: string;
  onClose?: () => void;
  variant?: 'card-button' | 'icon-only';
}

export const SharePopover: React.FC<SharePopoverProps> = ({
  movieTitle,
  movieId,
  onClose,
  variant = 'card-button'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getShareUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('movie', movieId);
      return url.toString();
    } catch {
      return window.location.href;
    }
  };

  const shareUrl = getShareUrl();
  const shareText = `Check out "${movieTitle}" on AfroMovieDB - The Definitive Nollywood Archive!`;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).catch(() => fallbackCopy(shareUrl));
      } else {
        fallbackCopy(shareUrl);
      }
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error('Fallback copy failed', e);
    }
    document.body.removeChild(textArea);
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=Nollywood,AfroMovieDB,NigerianCinema`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {variant === 'icon-only' ? (
        <button
          id={`share-icon-${movieId}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isOpen || copied
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 scale-105'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60'
          }`}
          title="Share film to WhatsApp, Twitter, Facebook or Copy link"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
        </button>
      ) : (
        <button
          id={`share-btn-${movieId}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            isOpen || copied
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Share film options"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <span className="text-[11px] font-bold text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
              <span className="text-[11px]">Share</span>
            </>
          )}
        </button>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 bottom-full mb-2 w-56 p-2 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl z-50 animate-fadeIn text-left"
        >
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Share Nollywood Title
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {/* WhatsApp */}
            <button
              id={`share-whatsapp-${movieId}`}
              onClick={handleShareWhatsApp}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
              </div>
              <span>WhatsApp</span>
            </button>

            {/* Twitter / X */}
            <button
              id={`share-twitter-${movieId}`}
              onClick={handleShareTwitter}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:bg-sky-950/60 hover:text-sky-300 transition-colors text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Twitter className="w-3.5 h-3.5 fill-current" />
              </div>
              <span>Twitter / X</span>
            </button>

            {/* Facebook */}
            <button
              id={`share-facebook-${movieId}`}
              onClick={handleShareFacebook}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:bg-blue-950/60 hover:text-blue-300 transition-colors text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Facebook className="w-3.5 h-3.5 fill-current" />
              </div>
              <span>Facebook</span>
            </button>

            <div className="border-t border-slate-800/80 my-1" />

            {/* Copy Link */}
            <button
              id={`share-copy-link-${movieId}`}
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                copied ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              </div>
              <span className={copied ? 'text-emerald-400 font-bold' : ''}>
                {copied ? 'Link Copied!' : 'Copy Direct Link'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
