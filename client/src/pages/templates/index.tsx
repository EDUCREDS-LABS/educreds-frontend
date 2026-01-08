import React from 'react';
import { Link } from 'wouter';

const TemplatesPage = () => {
  return (
    <div>
      <h1>Template Management</h1>
      <ul>
        <li>
          <Link href="/institution/templates/browse">Browse Templates</Link>
        </li>
        <li>
          <Link href="/institution/templates/my-templates">My Templates</Link>
        </li>
        <li>
          <Link href="/institution/templates/create">Create New Template</Link>
        </li>
        <li>
          <Link href="/institution/templates/designer">Template Designer</Link>
        </li>
      </ul>
    </div>
  );
};

export default TemplatesPage;
