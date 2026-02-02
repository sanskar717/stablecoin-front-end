# DSC Engine - Decentralized Stablecoin Protocol

A decentralized stablecoin protocol built on Ethereum with collateralized debt positions, live price feeds, and a clean user interface. This is the **frontend** repository for the DSC Engine project.

## 🏗️ Project Overview

DSC Engine is a DeFi protocol that allows users to:
- **Deposit ETH** as collateral
- **Mint DSC** (a decentralized stablecoin)
- **Manage Debt** with real-time health factor monitoring
- **Withdraw Collateral** when conditions are met
- **Monitor Positions** with live price feeds and transaction history

The protocol uses **Chainlink price oracles** to ensure accurate, decentralized price data and implements **collateralized debt positions** for secure stablecoin issuance.

## 📦 Tech Stack

### Frontend
- **Next.js** - React framework for production
- **JavaScript/React** - UI components and state management
- **CSS** - Styling and responsive design
- **Web3 Integration** - Blockchain interaction

## 🔗 Backend Repository

The smart contracts and backend server are available here:
**[stablecoin-backend](https://github.com/sanskar717/stablecoin-backend)**

This includes:
- Smart contract implementation (Solidity)
- Backend API server
- Contract deployment scripts
- Contract ABI files


## 📁 Project Structure

```
stablecoin-front-end/
├── src/
│   ├── app/
│   │   ├── repay/              # Debt repayment functionality
│   │   ├── transactions/       # Transaction history and management
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── HealthFactor.js     # Health factor display component
│   │   └── MoreMenu.js         # Additional menu options
│   ├── config/                 # Configuration files
│   ├── contracts/              # Smart contract ABIs
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── landingpage.js          # Landing page
│   ├── layout.js               # Layout wrapper
│   └── page.js                 # Main page component
├── public/                     # Static assets
├── .gitignore                  # Git ignore rules
├── .prettierignore             # Prettier ignore rules
├── .prettierrc                 # Prettier config
├── eslint.config.mjs           # ESLint configuration
├── jsconfig.json               # JavaScript config
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked versions
├── postcss.config.mjs          # PostCSS configuration
└── yarn.lock                   # Yarn lock file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask or similar Web3 wallet

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sanskar717/stablecoin-front-end.git
cd stablecoin-front-end
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_RPC_URL=your_rpc_endpoint
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_CHAINLINK_FEED_ADDRESS=chainlink_feed_address
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Key Features

### 1. **Deposit Collateral**
- Users can deposit ETH as collateral
- Real-time balance updates
- Transaction history tracking

### 2. **Mint Stablecoin**
- Mint DSC tokens against deposited collateral
- Dynamic pricing using Chainlink oracles
- Safety checks to prevent over-collateralization

### 3. **Health Factor Monitoring**
- Real-time health factor calculation
- Visual indicators for liquidation risk
- Automatic alerts when health factor is low

### 4. **Repay & Withdraw**
- Easy debt repayment interface
- Collateral withdrawal with safety checks
- Transaction confirmation and history

### 5. **Live Price Feeds**
- Chainlink oracle integration
- Real-time ETH/USD pricing
- Accurate collateral valuation

### 6. **Clean Frontend**
- User-friendly interface
- Responsive design for all devices
- Clear transaction history
- Intuitive dashboard

## 🔗 Backend Repository

The smart contracts and backend server are available here:
**[stablecoin-backend](https://github.com/sanskar717/stablecoin-backend)**

This includes:
- Smart contract implementation (Solidity)
- Backend API server
- Contract deployment scripts
- Contract ABI files

## 🛠️ Core Components

### HealthFactor.js
Displays the current health factor of the user's position, indicating liquidation risk.

### MoreMenu.js
Provides additional menu options and settings for the application.

### Repay System
Allows users to repay their debt and manage their positions safely.

### Transactions Module
Complete transaction history with status tracking and detailed information.

## 🔐 Smart Contract Integration

The frontend interacts with Ethereum smart contracts through:
- **Web3.js/Ethers.js** for blockchain communication
- **Chainlink** for decentralized price data
- **MetaMask** for transaction signing

Ensure you have the smart contract addresses configured in your `.env.local` file.

## 📊 Current Status

- ✅ Frontend UI fully functional
- ✅ Web3 wallet integration
- ✅ Real-time price feeds via Chainlink
- ✅ Health factor monitoring
- ✅ Transaction history tracking
- ✅ Clean, responsive design
- 🔄 Actively building and refining DeFi core functionality

## 🚧 Blockers & Roadmap

**Current Blockers:** None - actively building and refining core DeFi functionality and UI.

**Upcoming Features:**
- Enhanced liquidation mechanism
- Governance token integration
- Advanced position analytics
- Staking rewards
- Multi-collateral support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the MIT License.

## 📞 Contact & Support

For questions or support:
- GitHub: [@sanskar717](https://github.com/sanskar717)
- Project Repository: [stablecoin-front-end](https://github.com/sanskar717/stablecoin-front-end)
- Backend: [stablecoin-backend](https://github.com/sanskar717/stablecoin-backend)

## 🙏 Acknowledgments

- Chainlink for decentralized price oracles
- Ethereum community for smart contract best practices
- Next.js team for the amazing framework

---

**Built with ❤️ for the DeFi ecosystem**