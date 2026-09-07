import React from 'react';
import {
  getAsset,
  LumiAssetData,
  LumiAssetSize,
  LumiAssetColor,
} from '../visualSystem/LumiAssetRegistry';

export interface LumiAssetProps {
  assetId?: string;
  asset?: LumiAssetData;
  type?: string;
  color?: LumiAssetColor;
  size?: LumiAssetSize;
  className?: string;
  alt?: string;
  onClick?: (e: React.MouseEvent) => void;
  draggable?: boolean;
}

const SIZE_CLASSES: Record<LumiAssetSize, string> = {
  small: 'w-10 h-10 sm:w-12 sm:h-12',
  medium: 'w-16 h-16 sm:w-20 sm:h-20',
  large: 'w-24 h-24 sm:w-32 sm:h-32',
};

export const LumiAsset: React.FC<LumiAssetProps> = ({
  assetId,
  asset,
  type,
  color,
  size = 'medium',
  className = '',
  alt,
  onClick,
  draggable = false,
}) => {
  // Resolve asset data
  let resolvedAsset: LumiAssetData | undefined = asset;
  if (!resolvedAsset && assetId) {
    resolvedAsset = getAsset(assetId);
  }
  if (!resolvedAsset && type) {
    resolvedAsset = getAsset(type, color);
  }

  const [imgSrc, setImgSrc] = React.useState<string>(
    resolvedAsset?.filePath || resolvedAsset?.src || ''
  );

  React.useEffect(() => {
    setImgSrc(resolvedAsset?.filePath || resolvedAsset?.src || '');
  }, [resolvedAsset]);

  if (!resolvedAsset) {
    return (
      <div
        className={`bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs ${SIZE_CLASSES[size]} ${className}`}
      >
        ?
      </div>
    );
  }

  const defaultAlt = alt || `${resolvedAsset.name} (${resolvedAsset.color})`;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.medium;

  const handleError = () => {
    if (resolvedAsset && imgSrc !== resolvedAsset.src) {
      setImgSrc(resolvedAsset.src);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center p-1 select-none pointer-events-auto transition-transform active:scale-95 ${sizeClass} ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      <img
        src={imgSrc}
        onError={handleError}
        alt={defaultAlt}
        draggable={draggable}
        className="w-full h-full object-contain max-w-full max-h-full drop-shadow-xs"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};
