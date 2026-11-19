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

const contractAddress = String(import.meta.env.VITE_CONTRACT_ADDRESS ?? '').trim();
if (!contractAddress) {
  throw new Error(
    'Missing required VITE_CONTRACT_ADDRESS. Configure an explicit contract address before running the app.'
  );
}
if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  throw new Error(
    `Invalid VITE_CONTRACT_ADDRESS "${contractAddress}". Expected a 42-character hex address (0x...).`
  );
}

// Contract configuration
// RPC priority: env override → testnet public RPC → mainnet public RPC.
// NEVER use Alchemy as the default — the free-tier 30M CU/month limit is
// exhausted by normal app traffic. Public endpoints (sepolia.base.org,
// mainnet.base.org) have no metered cap and are sufficient for the current
// usage volume. Alchemy can still be used by setting VITE_ETHEREUM_RPC_URL
// explicitly in production if higher rate limits are needed.
export const CONTRACT_CONFIG = {
  address: contractAddress,
  abi: CONTRACT_ABI,
  rpcUrl:
    import.meta.env.VITE_ETHEREUM_RPC_URL ||
    import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
    import.meta.env.VITE_BASE_MAINNET_RPC_URL ||
    (import.meta.env.VITE_NETWORK === 'mainnet'
      ? 'https://mainnet.base.org'
      : 'https://sepolia.base.org'),
};

// Contract interface types
export interface CertificateData {
  id?: string;
  studentAddress?: string;
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
