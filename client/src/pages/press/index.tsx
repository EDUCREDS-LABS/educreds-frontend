import { FC } from "react";

const PressKitPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Press Kit</h1>
      
      <h2 className="text-3xl font-bold mb-4">Overview</h2>
      <p className="mb-4">
        This section helps media, investors, and partners understand EduCreds quickly.
      </p>

      <h2 className="text-3xl font-bold mb-4">Include:</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Brand Story</li>
        <li className="mb-2">Logo Pack (PNG, SVG, Light/Dark)</li>
        <li className="mb-2">Brand Colors + Typography</li>
        <li className="mb-2">Founder Bio</li>
        <li className="mb-2">Platform Screenshots</li>
        <li className="mb-2">One-Page Pitch PDF</li>
      </ul>

      <p className="mt-8">
        Press Contact:{" "}
        <a href="mailto:press@educreds.xyz" className="text-blue-500 hover:underline">
          press@educreds.xyz
        </a>
      </p>

      <h2 className="text-3xl font-bold mt-8 mb-4">Brand Story (short)</h2>
      <p>
        EduCreds is transforming academic records using blockchain and AI. Our platform enables institutions to issue digital certificates and employers to verify them instantly—ensuring trust, transparency, and security.
      </p>
    </div>
  );
};

export default PressKitPage;
