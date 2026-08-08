import React from 'react';

interface VideoEmbedProps {
  url: string;
  title?: string;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({ url, title }) => {
  const getEmbedUrl = (inputUrl: string): string | null => {
    if (!inputUrl) return null;
    const clean = inputUrl.trim();

    // YouTube
    const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = clean.match(/(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    return null;
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="my-8 space-y-2">
      <div className="relative w-full pb-[56.25%] h-0 bg-[#1b1b1e] rounded-[2px] overflow-hidden border border-[#2e2f33]">
        <iframe
          src={embedUrl}
          title={title || 'Embedded Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        />
      </div>
      {title && (
        <p className="text-center font-serif text-[13px] text-[#aaaaaa] italic">
          {title}
        </p>
      )}
    </div>
  );
};
