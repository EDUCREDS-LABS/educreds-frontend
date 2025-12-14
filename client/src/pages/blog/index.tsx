import { FC } from "react";

const BlogPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">EduCreds Blog — Insights for a Verified Future</h1>

      <h2 className="text-3xl font-bold mb-4">Topics you’ll publish:</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Blockchain in Education</li>
        <li className="mb-2">Future of academic verification</li>
        <li className="mb-2">AI-driven credential analytics</li>
        <li className="mb-2">Platform updates & feature releases</li>
        <li className="mb-2">Case studies from institutions</li>
        <li className="mb-2">Marketplace growth insights</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Sample Articles:</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">“Why Academic Fraud Is Getting Worse — And How Blockchain Stops It”</li>
        <li className="mb-2">“Introducing the EduCreds Certificate Marketplace”</li>
        <li className="mb-2">“How AI Helps Institutions Verify Students Faster”</li>
      </ul>
    </div>
  );
};

export default BlogPage;
