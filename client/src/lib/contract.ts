// Contract ABI for EduCreds Certificate Contract
export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "grade",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "completionDate",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "certificateType",
        "type": "string"
      }
    ],
    "name": "issueCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "studentName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "institutionName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "courseName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "grade",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "issueDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "issuedBy",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "completionDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "certificateType",
            "type": "string"
          }
        ],
        "internalType": "struct EduCredsCertificate.CertificateData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      }
    ],
    "name": "verifyCertificateByIPFS",
    "outputs": [
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "studentName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "institutionName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "courseName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "grade",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "issueDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "issuedBy",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "completionDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "certificateType",
            "type": "string"
          }
        ],
        "internalType": "struct EduCredsCertificate.CertificateData",
        "name": "cert",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      }
    ],
    "name": "getStudentCertificates",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "institutionAddress",
        "type": "address"
      }
    ],
    "name": "getInstitutionStats",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      }
    ],
    "name": "registerInstitution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "newEmail",
        "type": "string"
      }
    ],
    "name": "updateInstitutionInfo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "students",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "studentNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "courseNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "grades",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "ipfsHashes",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "completionDates",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "certificateTypes",
        "type": "string[]"
      }
    ],
    "name": "batchIssueCertificates",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      }
    ],
    "name": "ipfsHashExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "issuedBy",
        "type": "address"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "revokedBy",
        "type": "address"
      }
    ],
    "name": "CertificateRevoked",
    "type": "event"
  }
];

// Contract configuration
export const CONTRACT_CONFIG = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS || '0xBD4228241dc6BC14C027bF8B6A24f97bc9872068',
  abi: CONTRACT_ABI,
  rpcUrl: import.meta.env.VITE_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org'
};

// Contract interface types
export interface CertificateData {
  studentName: string;
  institutionName: string;
  courseName: string;
  grade: string;
  issueDate: number;
  ipfsHash: string;
  isValid: boolean;
  issuedBy: string;
  completionDate: number;
  certificateType: string;
}

export interface InstitutionStats {
  name: string;
  isAuthorized: boolean;
  registrationDate: number;
  certificatesIssued: number;
}
