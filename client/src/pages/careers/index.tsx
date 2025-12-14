import { FC } from "react";

const CareersPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Build the Future of Digital Credentials</h1>
      <p className="mb-4">
        Join a mission-driven team creating the world’s most trusted academic verification infrastructure.
      </p>

      <h2 className="text-3xl font-bold mb-4">We’re looking for:</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Frontend Developers (React / Next.js)</li>
        <li className="mb-2">Blockchain Engineers (Solidity / EVM)</li>
        <li className="mb-2">AI/ML Developers</li>
        <li className="mb-2">Partner & Community Managers</li>
        <li className="mb-2">UI/UX Designers</li>
        <li className="mb-2">Customer Success Specialists</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Perks:</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Fully remote</li>
        <li className="mb-2">Cutting-edge blockchain & AI projects</li>
        <li className="mb-2">Growth-focused environment</li>
        <li className="mb-2">Equity/Token opportunities ($EDUC in future)</li>
      </ul>

      <p className="mt-8">
        Don’t see your role? Send us an open application:{" "}
        <a href="mailto:careers@educreds.xyz" className="text-blue-500 hover:underline">
          careers@educreds.xyz
        </a>
      </p>
    </div>
  );
};

export default CareersPage;
