import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, type ImageProps, type ImageSourcePropType } from 'react-native';

type SafeImageProps = Omit<ImageProps, 'source'> & {
  source?: ImageSourcePropType;
  fallbackSource?: ImageSourcePropType;
  fallback?: ReactNode;
};

export const SafeImage = ({ source, fallbackSource, fallback, onError, ...props }: SafeImageProps) => {
  const candidates = useMemo(() => [source, fallbackSource].filter(Boolean) as ImageSourcePropType[], [fallbackSource, source]);
  const signature = JSON.stringify(candidates);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => setCandidateIndex(0), [signature]);

  const activeSource = candidates[candidateIndex];
  if (!activeSource) return <>{fallback ?? null}</>;

  return (
    <Image
      {...props}
      source={activeSource}
      onError={(event) => {
        console.warn('[storage] Image failed to render', { source: activeSource });
        setCandidateIndex((index) => index + 1);
        onError?.(event);
      }}
    />
  );
};
