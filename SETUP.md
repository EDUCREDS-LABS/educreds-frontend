# EduChain Frontend Setup Guide

This guide will help you set up the frontend to communicate with your backend and smart contract.

## Environment Configuration

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Update the environment variables in `.env`:**
   ```env
   # Backend Configuration
   VITE_API_BASE=https://educhain-backend-avmj.onrender.com
   
   # Smart Contract Configuration (Base Mainnet)
   VITE_CONTRACT_ADDRESS=0xBD4228241dc6BC14C027bF8B6A24f97bc9872068
   VITE_BASE_MAINNET_RPC_URL=https://mainnet.base.org
   VITE_NETWORK=base-mainnet
   
   # Optional: Use a different RPC provider for better performance
   # VITE_BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   # VITE_BASE_MAINNET_RPC_URL=https://base-mainnet.publicnode.com
   ```

3. **Blockchain Configuration (Base Mainnet):**
   
   Your smart contract is deployed on Base mainnet. For optimal performance:
   
   - **Free Option**: Use `https://mainnet.base.org` (already configured)
   - **Better Performance**: Use Alchemy or Infura for Base mainnet
   - **MetaMask Setup**: Configure MetaMask for Base mainnet (Chain ID: 8453)
   - **Network RPC**: `https://mainnet.base.org`
   - **Explorer**: `https://basescan.org`

## Recent Fixes (Latest Update)

### Dashboard Login Errors Fixed
- ✅ **Added missing backend endpoints**: `/api/blockchain/config`, `/api/blockchain/network`, `/api/institutions/:id/blockchain-status`
- ✅ **Fixed infinite retry loops**: Limited blockchain connection retries and added graceful fallbacks
- ✅ **Improved error handling**: Frontend now gracefully handles blockchain connection failures
- ✅ **Enhanced API fallbacks**: When blockchain is unavailable, frontend falls back to backend API calls
- ✅ **Better environment configuration**: Updated environment variable names and added proper defaults

### Error Resolution Summary
- **404 Errors**: Added missing blockchain configuration endpoints to backend
- **500 Errors**: Fixed institution blockchain status endpoint with proper error handling
- **Connection Refused**: Added graceful fallback when blockchain RPC is unavailable
- **Infinite Retries**: Limited React Query retries and added proper error boundaries

## 🚀 **NEW: Base Mainnet Blockchain Integration**

### **What's Now Working:**
- ✅ **Automatic Certificate Minting**: Certificates are automatically minted on Base mainnet when issued
- ✅ **Real Blockchain Transactions**: All certificate operations create actual blockchain transactions
- ✅ **Dual Verification**: Certificates are verified on both database and blockchain
- ✅ **Transaction Tracking**: All blockchain transactions are recorded and tracked
- ✅ **Certificate Revocation**: Admins can revoke certificates on both database and blockchain

### **Backend Integration:**
- ✅ **Smart Contract Calls**: Backend now calls your Base mainnet contract
- ✅ **Transaction Recording**: All blockchain transactions are stored in database
- ✅ **Error Handling**: Graceful fallback if blockchain operations fail
- ✅ **Admin Controls**: Certificate revocation and institution management

### **Frontend Integration:**
- ✅ **Base Mainnet Configuration**: Updated to use Base mainnet RPC and contract
- ✅ **Transaction Display**: Shows blockchain transaction details
- ✅ **Verification Status**: Displays both database and blockchain verification
- ✅ **MetaMask Integration**: Works with Base mainnet MetaMask configuration

## Key Features Implemented

### 1. Certificate Issuance
- **Institutions** can issue certificates through the backend
- **Optional blockchain minting** when student wallet address is provided
- **Batch issuance** support for multiple certificates
- **IPFS integration** for certificate storage

### 2. Certificate Verification
- **Dual verification**: Backend + Blockchain
- **IPFS hash verification** for blockchain-only certificates
- **Certificate ID verification** for backend certificates
- **Real-time validation** status

### 3. Wallet Integration
- **MetaMask connection** for institutions and students
- **Student wallet linking** to certificates
- **Certificate ownership** tracking on blockchain

### 4. Institution Management
- **Institution registration** on blockchain
- **Profile management** and updates
- **Statistics tracking** from both backend and blockchain

## Admin Blockchain Management Setup

### Admin Access
1. **Login Credentials:**
   - Email: `admin@educhain.com`
   - Password: `admin123`

2. **Access Admin Dashboard:**
   - Navigate to `/admin/login`
   - Enter credentials to access blockchain management

### Blockchain Management Features

#### 1. Institution Registration on Blockchain
```typescript
// Backend automatically registers institutions when approved
// Admin can also manually register institutions:

POST /api/admin/institutions/:institutionId/blockchain-register
Headers: { 'admin-email': 'admin@educhain.com' }
```

#### 2. Bulk Registration
```typescript
// Register all verified institutions at once
POST /api/admin/blockchain-register-all
Headers: { 'admin-email': 'admin@educhain.com' }
```

#### 3. Institution Authorization
```typescript
// Authorize institutions to issue certificates
POST /api/admin/institutions/:institutionId/blockchain-authorize
Headers: { 'admin-email': 'admin@educhain.com' }
```

### Blockchain Status Monitoring
- **Summary Dashboard**: Overview of all institutions' blockchain status
- **Individual Tracking**: Detailed status for each institution
- **Transaction History**: View blockchain transaction hashes
- **Error Reporting**: Comprehensive error tracking for failed operations

### Network Configuration
- **Testnet**: Sepolia (Ethereum testnet)
- **Explorer**: Etherscan integration for transaction verification
- **Smart Contract**: EduChain certificate management contract

## Usage Examples

### For Institutions

```typescript
import { useCertificate } from '@/hooks/useCertificate';

function IssueCertificateForm() {
  const { issueCertificate, isIssuing } = useCertificate();

  const handleSubmit = async (formData) => {
    const request = {
      studentName: formData.studentName,
      studentEmail: formData.studentEmail,
      studentWalletAddress: formData.walletAddress, // Optional
      courseName: formData.courseName,
      grade: formData.grade,
      completionDate: formData.completionDate,
      certificateType: formData.certificateType,
      certificateFile: formData.file
    };

    await issueCertificate.mutateAsync(request);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button type="submit" disabled={isIssuing}>
        {isIssuing ? 'Issuing...' : 'Issue Certificate'}
      </button>
    </form>
  );
}
```

### For Students

```typescript
import { useWalletCertificates } from '@/hooks/useCertificate';

function StudentDashboard({ walletAddress }) {
  const { certificates, isLoading, connectWallet } = useWalletCertificates(walletAddress);

  return (
    <div>
      <h2>My Certificates</h2>
      {isLoading ? (
        <p>Loading certificates...</p>
      ) : (
        certificates.map(cert => (
          <div key={cert.certificateId || cert.tokenId}>
            <h3>{cert.blockchainData?.courseName || cert.backendData?.courseName}</h3>
            <p>Status: {cert.isValid ? 'Valid' : 'Invalid'}</p>
            <p>Source: {cert.verificationSource}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

### Certificate Verification

```typescript
import { useCertificateVerification } from '@/hooks/useCertificate';

function CertificateVerifier() {
  const { verificationResult, isVerifying, verifyById, verifyByIPFS } = useCertificateVerification();

  const handleVerifyById = async (certificateId: string) => {
    await verifyById(certificateId);
  };

  const handleVerifyByIPFS = async (ipfsHash: string) => {
    await verifyByIPFS(ipfsHash);
  };

  return (
    <div>
      {/* Verification forms */}
      {verificationResult && (
        <div>
          <h3>Verification Result</h3>
          <p>Valid: {verificationResult.isValid ? 'Yes' : 'No'}</p>
          <p>Source: {verificationResult.verificationSource}</p>
          {/* Display certificate details */}
        </div>
      )}
    </div>
  );
}
```

## Backend Integration

The frontend is configured to work with your backend at `https://educhain-backend-avmj.onrender.com`. The following endpoints are expected:

### Required Backend Endpoints

1. **Certificate Issuance**
   - `POST /api/certificates/issue` - Issue a new certificate
   - `PATCH /api/certificates/{id}/mint` - Update certificate with blockchain data

2. **Certificate Verification**
   - `GET /api/certificates/verify/{id}` - Verify certificate by ID
   - `GET /api/certificates/wallet/{address}` - Get certificates by wallet

3. **Institution Management**
   - `GET /api/institutions/profile` - Get institution profile
   - `GET /api/stats` - Get institution statistics

4. **Student Management**
   - `POST /api/students/connect-wallet` - Connect student wallet

## Smart Contract Integration

The frontend integrates with your smart contract at `0xBD4228241dc6BC14C027bF8B6A24f97bc9872068` and supports:

- Certificate issuance and minting
- Certificate verification by token ID and IPFS hash
- Institution registration and management
- Student certificate tracking
- Certificate revocation

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Troubleshooting

### Common Issues

1. **MetaMask not connecting:**
   - Ensure MetaMask is installed and unlocked
   - Check if you're on the correct network
   - Try refreshing the page

2. **Backend connection errors:**
   - Verify the `VITE_API_URL` is correct
   - Check if your backend is running and accessible
   - Ensure CORS is properly configured on your backend

3. **Smart contract errors:**
   - Verify the contract address is correct
   - Ensure you're on the correct network (Ethereum mainnet)
   - Check if the contract ABI is properly formatted

4. **Certificate verification fails:**
   - Check if the certificate exists in both backend and blockchain
   - Verify the IPFS hash is correct
   - Ensure the certificate hasn't been revoked

### Environment Variables Checklist

- [ ] `VITE_API_URL` points to your backend
- [ ] `VITE_CONTRACT_ADDRESS` is your deployed contract address
- [ ] `VITE_ETHEREUM_RPC_URL` is a valid RPC endpoint
- [ ] `VITE_CONTRACT_ABI` contains the complete contract ABI

## Next Steps

1. **Test the integration** with your backend
2. **Deploy the frontend** to your preferred hosting platform
3. **Configure production environment** variables
4. **Set up monitoring** for certificate operations
5. **Implement additional features** as needed

For support or questions, refer to the code comments and TypeScript interfaces for detailed information about each function and component.
