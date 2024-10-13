# Payroll Privacy Hackathon Submission

## Project Overview

This project introduces a private payroll solution leveraging blockchain technology to ensure privacy in employee payments. Using Circle Programmable Wallets, SurferMonkey SDK for privacy preservation, and SAP Business Application Studio, we address the issue of privacy when making payments in USDC. The project ensures that payroll information is kept confidential, preventing public visibility of sensitive financial data. We have also incorporated a unique fractional output technology to optimize payroll disbursements, providing secure and efficient payroll payments.

## Selected Hackathon Track

**Circle Track**

## Project Description

The goal of our project is to bring privacy and efficiency to payroll payments. Businesses can benefit from blockchain-based payments without compromising on the confidentiality of employee salaries. We utilized Circle Programmable Wallets and SurferMonkey for privacy, which allows us to fractionalize outputs and execute secure payroll transactions on the blockchain. The combination of zero-knowledge proofs (ZKPs) and programmable wallets ensures privacy, security, and efficiency in payroll disbursement.

## Technologies Used

- **Circle Programmable Wallets** for managing and executing payments.
- **SurferMonkey SDK** for privacy preservation, including generating and settling zero-knowledge proofs.
- **SAP Business Application Studio** for seamless integration with business payroll systems.
- **Zero-Knowledge Proofs (Circom)** for enabling private transactions.
- **Polygon Amoy TestNet** as the blockchain test network for transactions.
- **React Framework** for front-end application.
- **Node.js** as the backend runtime for the payroll processing logic.
- **Databases (CSV Data Storage)** for employee and wallet information.
- **Polygon Amoy Testnet** for blockchain interaction.

## Features Implemented During the Hackathon

- **Private Payroll Transactions**: Integrated Circle Programmable Wallets and SurferMonkey SDK to facilitate secure payroll transactions, keeping salary details private.
- **SAP Integration**: Integrated SAP Business Application Studio to streamline payroll management.
- **Fresh Codebase**: The entire solution is newly developed, including fresh code for SAP integration, Circle Programmable Wallets, and SurferMonkey privacy implementation.
- **Fractional Output Technology**: Added functionality for splitting payments into smaller parts, making payroll processing more efficient.
- **Zero-Knowledge Proof Generation**: Utilized zero-knowledge proofs for ensuring transaction privacy.
- **Payment Automation**: Automated payment and payroll processing using blockchain technology.

## Installation and Usage Instructions

### Prerequisites
- Node.js (version 14 or higher)
- NPM or Yarn for dependency management
- A Circle account with access to Programmable Wallets
- SAP Business Application Studio access

### Setup Instructions

1. **Navigate to SAP**
   Input credentials

2. **Go to Business Application Studio**
   Start the Studio Environment

3. **Set Environment Variables**
   Naviaget to src folder and run: node main.js


## How It Works

1. **Data Extraction**: The script reads employee and wallet data from CSV files to extract payroll details.
2. **Employee Wallets**: Employee wallet addresses are retrieved using the `getWalletByID()` function.
3. **Circle Wallet Approval**: Approval is initiated for USDC using Circle Wallet services.
4. **Deposit Creation**: A deposit is created using SurferMonkey, including ZKP generation and privacy features.
5. **Payment Settlement**: The payroll payments are settled using ZKPs to keep all salary information private and confidential.

## Code Structure

- **config.js**: Contains the application configuration settings.
- **tools/CircleWalletAux.js**: Utility for handling Circle Wallet operations.
- **libs/DynamicHelpers.js**: Helper functions for processing payments and storing deposit data.
- **SDK/SurferMonkeyLib.js**: SurferMonkey SDK for ZKP generation and privacy features.
- **db/data/**: Directory containing CSV files with employee and digital asset payment data.

