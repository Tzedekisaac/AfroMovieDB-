import React, { useState, useEffect } from 'react';
import { User, Film } from 'lucide-react';
import { fetchPersonHeadshot, KNOWN_PERSON_HEADSHOTS, normalizePersonName } from '../utils/api';

interface PersonHeadshotProps {
  personName: string;
  avatarUrl?: string;
  tmdbId?: number;
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackIcon?: 'user' | 'film';
}

export const PersonHeadshot: React.FC<PersonHeadshotProps> = ({
  personName,
  avatarUrl,
  tmdbId,
  className = '',
  alt,
  size = 'md',
  fallbackIcon = 'user'
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(() => {
    if (avatarUrl) return avatarUrl;
    const clean = personName.toLowerCase().trim();
    if (KNOWN_PERSON_HEADSHOTS[clean]) return KNOWN_PERSON_HEADSHOTS[clean];
    const norm = normalizePersonName(personName).toLowerCase();
    if (KNOWN_PERSON_HEADSHOTS[norm]) return KNOWN_PERSON_HEADSHOTS[norm];
    return undefined;
  });

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!resolvedUrl && !!personName.trim());

  useEffect(() => {
    let isMounted = true;

    if (avatarUrl) {
      setResolvedUrl(avatarUrl);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    const clean = personName.toLowerCase().trim();
    if (KNOWN_PERSON_HEADSHOTS[clean]) {
      setResolvedUrl(KNOWN_PERSON_HEADSHOTS[clean]);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    const norm = normalizePersonName(personName).toLowerCase();
    if (KNOWN_PERSON_HEADSHOTS[norm]) {
      setResolvedUrl(KNOWN_PERSON_HEADSHOTS[norm]);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    // Fetch official headshot dynamically from TMDb
    setIsLoading(true);
    fetchPersonHeadshot(personName, tmdbId)
      .then((url) => {
        if (isMounted) {
          if (url) {
            setResolvedUrl(url);
            setHasError(false);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [personName, avatarUrl, tmdbId]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 text-lg'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (resolvedUrl && !hasError) {
    return (
      <div className={`relative overflow-hidden shrink-0 rounded-full bg-slate-800 ${currentSizeClass} ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        )}
        <img
          src={resolvedUrl}
          alt={alt || personName}
          className="w-full h-full object-cover object-top transition-opacity duration-300"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Graceful visual icon fallback with subtle gradient
  return (
    <div
      className={`relative shrink-0 rounded-full bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 flex items-center justify-center text-emerald-400 ${currentSizeClass} ${className}`}
      title={personName}
    >
      {fallbackIcon === 'film' ? (
        <Film className="w-1/2 h-1/2 text-emerald-400/80" />
      ) : (
        <User className="w-1/2 h-1/2 text-emerald-400/80" />
      )}
    </div>
  );
};
