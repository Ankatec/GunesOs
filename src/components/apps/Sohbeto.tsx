import React from "react";

const Sohbeto: React.FC = () => {
  // BASE_URL takes care of "/gunesos/" prefix on GitHub Pages and "/" in dev.
  const src = `${import.meta.env.BASE_URL}apps/sohbetoOO.html`;
  return (
    <iframe
      title="Sohbeto"
      src={src}
      className="w-full h-full border-0 bg-[#0e1621]"
      allow="camera; microphone; clipboard-write; clipboard-read; autoplay"
    />
  );
};

export default Sohbeto;
