import { Template } from '../types/template';

export const defaultTemplates: Template[] = [
  {
    metadata: {
      id: 'academic-classic',
      name: 'Academic Classic',
      category: 'academic',
      description: 'A traditional academic certificate with elegant typography and formal design',
      fields: [
        { name: 'studentName', type: 'text', required: true, placeholder: 'Student Name' },
        { name: 'courseTitle', type: 'text', required: true, placeholder: 'Course Title' },
        { name: 'institutionName', type: 'text', required: true, placeholder: 'Institution Name' },
        { name: 'issueDate', type: 'date', required: true, placeholder: 'Issue Date' },
        { name: 'certificateId', type: 'text', required: true, placeholder: 'Certificate ID' },
        { name: 'grade', type: 'text', required: false, placeholder: 'Grade (Optional)' },
        { name: 'duration', type: 'text', required: false, placeholder: 'Duration (Optional)' }
      ],
      previewImage: '/templates/academic-classic-preview.png',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    design: `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bg)"/>
        
        <!-- Border -->
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#border)" stroke-width="3"/>
        <rect x="40" y="40" width="720" height="520" fill="none" stroke="#1e40af" stroke-width="1"/>
        
        <!-- Header -->
        <text x="400" y="80" text-anchor="middle" font-family="serif" font-size="36" font-weight="bold" fill="#1e40af">CERTIFICATE</text>
        <text x="400" y="110" text-anchor="middle" font-family="serif" font-size="18" fill="#64748b">OF COMPLETION</text>
        
        <!-- Main Content -->
        <text x="400" y="180" text-anchor="middle" font-family="serif" font-size="16" fill="#374151">This is to certify that</text>
        
        <text x="400" y="220" text-anchor="middle" font-family="serif" font-size="28" font-weight="bold" fill="#1e40af">{{studentName}}</text>
        
        <text x="400" y="260" text-anchor="middle" font-family="serif" font-size="16" fill="#374151">has successfully completed</text>
        
        <text x="400" y="300" text-anchor="middle" font-family="serif" font-size="24" font-weight="bold" fill="#1e40af">{{courseTitle}}</text>
        
        <text x="400" y="340" text-anchor="middle" font-family="serif" font-size="16" fill="#374151">issued by</text>
        
        <text x="400" y="380" text-anchor="middle" font-family="serif" font-size="20" font-weight="bold" fill="#1e40af">{{institutionName}}</text>
        
        <text x="400" y="420" text-anchor="middle" font-family="serif" font-size="16" fill="#374151">on {{issueDate}}</text>
        
        <!-- Certificate ID -->
        <text x="400" y="480" text-anchor="middle" font-family="monospace" font-size="12" fill="#64748b">Certificate ID: {{certificateId}}</text>
        
        <!-- QR Code Placeholder -->
        <rect x="650" y="500" width="80" height="80" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
        <text x="690" y="545" text-anchor="middle" font-family="monospace" font-size="8" fill="#64748b">QR</text>
      </svg>
    `
  },
  {
    metadata: {
      id: 'training-modern',
      name: 'Training Modern',
      category: 'training',
      description: 'A modern, clean design perfect for corporate training certificates',
      fields: [
        { name: 'studentName', type: 'text', required: true, placeholder: 'Student Name' },
        { name: 'courseTitle', type: 'text', required: true, placeholder: 'Course Title' },
        { name: 'institutionName', type: 'text', required: true, placeholder: 'Institution Name' },
        { name: 'issueDate', type: 'date', required: true, placeholder: 'Issue Date' },
        { name: 'certificateId', type: 'text', required: true, placeholder: 'Certificate ID' },
        { name: 'instructor', type: 'text', required: false, placeholder: 'Instructor Name' },
        { name: 'score', type: 'number', required: false, placeholder: 'Score (%)' }
      ],
      previewImage: '/templates/training-modern-preview.png',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    design: `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-modern" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bg-modern)"/>
        
        <!-- Top accent bar -->
        <rect x="0" y="0" width="800" height="8" fill="url(#accent)"/>
        
        <!-- Left accent bar -->
        <rect x="0" y="0" width="8" height="600" fill="url(#accent)"/>
        
        <!-- Header -->
        <text x="400" y="80" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="bold" fill="#059669">TRAINING CERTIFICATE</text>
        
        <!-- Decorative line -->
        <line x1="200" y1="100" x2="600" y2="100" stroke="#059669" stroke-width="2"/>
        
        <!-- Main Content -->
        <text x="400" y="160" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">This certificate is awarded to</text>
        
        <text x="400" y="200" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#111827">{{studentName}}</text>
        
        <text x="400" y="240" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">for successfully completing</text>
        
        <text x="400" y="280" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#059669">{{courseTitle}}</text>
        
        <text x="400" y="320" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">provided by</text>
        
        <text x="400" y="360" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#111827">{{institutionName}}</text>
        
        <text x="400" y="400" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">on {{issueDate}}</text>
        
        <!-- Certificate ID -->
        <text x="400" y="480" text-anchor="middle" font-family="monospace" font-size="12" fill="#9ca3af">ID: {{certificateId}}</text>
        
        <!-- QR Code Placeholder -->
        <rect x="650" y="500" width="80" height="80" fill="#f9fafb" stroke="#d1d5db" stroke-width="1"/>
        <text x="690" y="545" text-anchor="middle" font-family="monospace" font-size="8" fill="#9ca3af">QR</text>
      </svg>
    `
  },
  {
    metadata: {
      id: 'corporate-award',
      name: 'Corporate Award',
      category: 'corporate',
      description: 'A prestigious design for corporate awards and recognition certificates',
      fields: [
        { name: 'studentName', type: 'text', required: true, placeholder: 'Recipient Name' },
        { name: 'courseTitle', type: 'text', required: true, placeholder: 'Award Title' },
        { name: 'institutionName', type: 'text', required: true, placeholder: 'Company Name' },
        { name: 'issueDate', type: 'date', required: true, placeholder: 'Issue Date' },
        { name: 'certificateId', type: 'text', required: true, placeholder: 'Certificate ID' },
        { name: 'achievement', type: 'text', required: false, placeholder: 'Achievement Description' },
        { name: 'presenter', type: 'text', required: false, placeholder: 'Presenter Name' }
      ],
      previewImage: '/templates/corporate-award-preview.png',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    design: `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-award" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bg-award)"/>
        
        <!-- Border -->
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#gold)" stroke-width="4"/>
        
        <!-- Header -->
        <text x="400" y="80" text-anchor="middle" font-family="serif" font-size="40" font-weight="bold" fill="url(#gold)">AWARD</text>
        <text x="400" y="110" text-anchor="middle" font-family="serif" font-size="20" fill="url(#gold)">OF EXCELLENCE</text>
        
        <!-- Main Content -->
        <text x="400" y="180" text-anchor="middle" font-family="serif" font-size="18" fill="#d1d5db">This prestigious award is presented to</text>
        
        <text x="400" y="220" text-anchor="middle" font-family="serif" font-size="32" font-weight="bold" fill="url(#gold)">{{studentName}}</text>
        
        <text x="400" y="260" text-anchor="middle" font-family="serif" font-size="18" fill="#d1d5db">in recognition of</text>
        
        <text x="400" y="300" text-anchor="middle" font-family="serif" font-size="26" font-weight="bold" fill="url(#gold)">{{courseTitle}}</text>
        
        <text x="400" y="340" text-anchor="middle" font-family="serif" font-size="18" fill="#d1d5db">by</text>
        
        <text x="400" y="380" text-anchor="middle" font-family="serif" font-size="22" font-weight="bold" fill="url(#gold)">{{institutionName}}</text>
        
        <text x="400" y="420" text-anchor="middle" font-family="serif" font-size="18" fill="#d1d5db">on {{issueDate}}</text>
        
        <!-- Certificate ID -->
        <text x="400" y="480" text-anchor="middle" font-family="monospace" font-size="12" fill="#9ca3af">Award ID: {{certificateId}}</text>
        
        <!-- QR Code Placeholder -->
        <rect x="650" y="500" width="80" height="80" fill="#374151" stroke="url(#gold)" stroke-width="1"/>
        <text x="690" y="545" text-anchor="middle" font-family="monospace" font-size="8" fill="url(#gold)">QR</text>
      </svg>
    `
  },
  {
    metadata: {
      id: 'hackathon-badge',
      name: 'Hackathon Badge',
      category: 'hackathon',
      description: 'A vibrant, tech-inspired design for hackathon and bootcamp certificates',
      fields: [
        { name: 'studentName', type: 'text', required: true, placeholder: 'Participant Name' },
        { name: 'courseTitle', type: 'text', required: true, placeholder: 'Hackathon/Bootcamp Name' },
        { name: 'institutionName', type: 'text', required: true, placeholder: 'Organizer Name' },
        { name: 'issueDate', type: 'date', required: true, placeholder: 'Issue Date' },
        { name: 'certificateId', type: 'text', required: true, placeholder: 'Certificate ID' },
        { name: 'project', type: 'text', required: false, placeholder: 'Project Name' },
        { name: 'team', type: 'text', required: false, placeholder: 'Team Name' }
      ],
      previewImage: '/templates/hackathon-badge-preview.png',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    design: `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-hackathon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bg-hackathon)"/>
        
        <!-- Tech pattern -->
        <g opacity="0.1">
          <circle cx="100" cy="100" r="2" fill="url(#neon)"/>
          <circle cx="700" cy="150" r="2" fill="url(#neon)"/>
          <circle cx="150" cy="500" r="2" fill="url(#neon)"/>
          <circle cx="650" cy="450" r="2" fill="url(#neon)"/>
        </g>
        
        <!-- Header -->
        <text x="400" y="80" text-anchor="middle" font-family="monospace" font-size="36" font-weight="bold" fill="url(#neon)">HACKATHON</text>
        <text x="400" y="110" text-anchor="middle" font-family="monospace" font-size="18" fill="url(#neon)">COMPLETION BADGE</text>
        
        <!-- Main Content -->
        <text x="400" y="180" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#cbd5e1">Congratulations to</text>
        
        <text x="400" y="220" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold" fill="url(#neon)">{{studentName}}</text>
        
        <text x="400" y="260" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#cbd5e1">for successfully completing</text>
        
        <text x="400" y="300" text-anchor="middle" font-family="monospace" font-size="24" font-weight="bold" fill="url(#neon)">{{courseTitle}}</text>
        
        <text x="400" y="340" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#cbd5e1">organized by</text>
        
        <text x="400" y="380" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="url(#neon)">{{institutionName}}</text>
        
        <text x="400" y="420" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#cbd5e1">on {{issueDate}}</text>
        
        <!-- Certificate ID -->
        <text x="400" y="480" text-anchor="middle" font-family="monospace" font-size="12" fill="#64748b">Badge ID: {{certificateId}}</text>
        
        <!-- QR Code Placeholder -->
        <rect x="650" y="500" width="80" height="80" fill="#1e293b" stroke="url(#neon)" stroke-width="1"/>
        <text x="690" y="545" text-anchor="middle" font-family="monospace" font-size="8" fill="url(#neon)">QR</text>
      </svg>
    `
  },
  {
    metadata: {
      id: 'workshop-minimal',
      name: 'Workshop Minimal',
      category: 'workshop',
      description: 'A clean, minimal design perfect for workshop and seminar certificates',
      fields: [
        { name: 'studentName', type: 'text', required: true, placeholder: 'Participant Name' },
        { name: 'courseTitle', type: 'text', required: true, placeholder: 'Workshop Title' },
        { name: 'institutionName', type: 'text', required: true, placeholder: 'Organizer Name' },
        { name: 'issueDate', type: 'date', required: true, placeholder: 'Issue Date' },
        { name: 'certificateId', type: 'text', required: true, placeholder: 'Certificate ID' },
        { name: 'duration', type: 'text', required: false, placeholder: 'Workshop Duration' },
        { name: 'location', type: 'text', required: false, placeholder: 'Location' }
      ],
      previewImage: '/templates/workshop-minimal-preview.png',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    design: `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-minimal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fafafa;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bg-minimal)"/>
        
        <!-- Minimal border -->
        <rect x="40" y="40" width="720" height="520" fill="none" stroke="#e5e7eb" stroke-width="2"/>
        
        <!-- Header -->
        <text x="400" y="100" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="300" fill="#374151">CERTIFICATE</text>
        
        <!-- Main Content -->
        <text x="400" y="180" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">This certifies that</text>
        
        <text x="400" y="220" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="400" fill="#111827">{{studentName}}</text>
        
        <text x="400" y="260" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">has participated in</text>
        
        <text x="400" y="300" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="500" fill="#374151">{{courseTitle}}</text>
        
        <text x="400" y="340" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">organized by</text>
        
        <text x="400" y="380" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="500" fill="#111827">{{institutionName}}</text>
        
        <text x="400" y="420" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">on {{issueDate}}</text>
        
        <!-- Certificate ID -->
        <text x="400" y="480" text-anchor="middle" font-family="monospace" font-size="12" fill="#9ca3af">ID: {{certificateId}}</text>
        
        <!-- QR Code Placeholder -->
        <rect x="650" y="500" width="80" height="80" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
        <text x="690" y="545" text-anchor="middle" font-family="monospace" font-size="8" fill="#9ca3af">QR</text>
      </svg>
    `
  }
];
