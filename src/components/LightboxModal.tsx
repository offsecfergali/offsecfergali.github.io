import React from 'react';
import { X } from 'lucide-react';

interface LightboxModalProps {
  imageUrl: string;
  caption?: string;
  altText?: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  imageUrl,
  caption,
  altText,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-[2px] bg-[#212225] text-white hover:bg-[#2e2f33] border border-[#2e2f33] transition-colors cursor-pointer"
        aria-label="Close Lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {Boolean(imageUrl && imageUrl.trim()) ? (
          <img
            src={imageUrl.trim()}
            alt={altText || caption || 'Enlarged post image'}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[75vh] object-contain rounded-[2px] shadow-2xl"
          />
        ) : null}

        {(caption || altText) && (
          <p className="mt-4 text-center text-[14px] font-serif text-[#D4D4D4] bg-[#212225]/80 px-4 py-2 rounded-[2px] border border-[#2e2f33] max-w-2xl">
            {caption || altText}
          </p>
        )}
      </div>
    </div>
  );
};
