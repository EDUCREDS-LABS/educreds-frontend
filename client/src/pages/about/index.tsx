import { FC } from "react";

const AboutUsPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">About EduCreds</h1>
      <p className="mb-4">
        EduCreds is a blockchain-powered credentialing platform that enables educational institutions to issue tamper-proof digital certificates and allows employers to verify them instantly. Built on the Base Network, EduCreds ensures academic records are secure, permanent, and globally accessible.
      </p>

      <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
      <p className="mb-4">
        To create trusted, transparent, and verifiable academic credentials for learners, institutions, and employers worldwide.
      </p>

      <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
      <p className="mb-4">
        To become the global infrastructure for academic and professional identity verification.
      </p>

      <h2 className="text-3xl font-bold mb-4">What We Stand For</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Security & Transparency</li>
        <li className="mb-2">Decentralization</li>
        <li className="mb-2">Scalability</li>
        <li className="mb-2">Accessibility</li>
        <li className="mb-2">Innovation through AI</li>
      </ul>
    </div>
  );
};

export default AboutUsPage;
