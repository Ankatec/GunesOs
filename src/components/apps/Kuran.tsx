import React from "react";

const Kuran: React.FC = () => {
  const src = `${import.meta.env.BASE_URL}apps/kuran.html`;
  return (
    <iframe
      title="Vakit & Kuran Pro"
      src={src}
      className="w-full h-full border-0 bg-[#020617]"
      allow="geolocation; autoplay; clipboard-write"
    />
  );
};

export default Kuran;
