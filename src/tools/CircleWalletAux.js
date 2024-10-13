
const ck = require('ckey'); //Load env variables
// Import and configure the developer-controlled wallet SDK
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');
// Import and configure the smart contract SDK
const { initiateSmartContractPlatformClient } = require('@circle-fin/smart-contract-platform');
const forge = require('node-forge')
const crypto = require('crypto')
const DynamicHelpers = require('../libs/DynamicHelpers.js');
const config = require('../config.js');

// Obtain sensible data (env variables)
const {
    CIRCLE_API,
    ENTITY_SECRET,
    WALLET_SET_ID
} = process.env;

// initDevWalletClient
const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
    apiKey: CIRCLE_API,
    entitySecret: ENTITY_SECRET
});

const circleContractSdk = initiateSmartContractPlatformClient({
    apiKey: CIRCLE_API,
    entitySecret: ENTITY_SECRET
});

// Generate the Entity Secret
function generateNewEntitySecret() {
    const secret = crypto.randomBytes(32).toString('hex')
    return secret
}

// Fetch your Entity's Public Key
async function getCirclePubKey() {
    const response = await circleDeveloperSdk.getPublicKey({});
    const pubKey = response.data.publicKey
    //console.log(pubKey)
    return pubKey
}

// Generate Entity Secret Ciphertext
async function getEntityCipher(_ENTITY_SECRET, _CIRCLE_PUB_KEY) {
    const entitySecret = forge.util.hexToBytes(_ENTITY_SECRET)
    const publicKey = forge.pki.publicKeyFromPem(_CIRCLE_PUB_KEY)
    const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
            md: forge.md.sha256.create(),
        },
    })
    return forge.util.encode64(encryptedData)
}

// Wrapper funciton to get the entityCipher
async function getEntityCipherWrap(_ENTITY_SECRET) {
    const PUB_KEY = await getCirclePubKey()
    const ENTITY_CIPHER = getEntityCipher(_ENTITY_SECRET, PUB_KEY)
    return ENTITY_CIPHER
}

// Create a Wallet Set
async function createWalletSet(_walletSetName) {
    const response = await circleDeveloperSdk.createWalletSet({
        name: 'Entity WalletSet A'
    });
    return response.data
}

// Create a Wallet
async function createWallet(_Accounttype, _network, _walletSetId) {
    const response = await circleDeveloperSdk.createWallets({
        accountType: _Accounttype, //SCA or EOA
        blockchains: _network,
        count: 1, // Number of wallets to crete
        walletSetId: _walletSetId // ID of the Wallets Set
    });

    // Store the deposit data locally for debugging
    await DynamicHelpers.storeFile(response.data, "Wallets_" + _walletSetId);

    return response.data
}

async function checkWalletBalance(_walletID) {
    const response = await circleDeveloperSdk.getWalletTokenBalance({
        id: _walletID
    });
    return response.data
}

async function listWallets(_network) {
    const response = await circleDeveloperSdk.listWallets({
        blockchain: _network
    });
    return response.data
}

async function getContract(_contractID) {
    const response = await circleContractSdk.getContract({
        id: _contractID
    });
    return response.data
}

async function depositERCUP(_userWalletID, _arrParams) {
    const response = await circleDeveloperSdk.createContractExecutionTransaction({
        walletId: _userWalletID,
        contractAddress: config.UNIVERSAL_PLUGIN,
        abiFunctionSignature: "DepositIntentErc20(bytes32 _commitmentHash, address _tokenAddress, uint256 _amountTotal)",
        tokenId: "36b6931a-873a-56a8-8a27-b706b17104ee", // USDC
        abiParameters: _arrParams,
        fee: {
            type: 'level',
            config: {
                feeLevel: 'MEDIUM'
            }
        }
    });
    return response
}

async function depositNativeUP(_userWalletID, _arrParams, _amountDecimalString) {
    const response = await circleDeveloperSdk.createContractExecutionTransaction({
        walletId: _userWalletID,
        contractAddress: config.UNIVERSAL_PLUGIN,
        abiFunctionSignature: "DepositIntentNative(bytes32 _commitmentHash)",
        tokenId: "0c8f8485-f74f-5e28-80f2-3cc4e80ef71c",
        amount: "0.00001",
        abiParameters: _arrParams,
        fee: {
            type: 'level',
            config: {
                feeLevel: 'MEDIUM'
            }
        }
    });
    return response
}


async function settleZKP(_relayerWalletID, _arrParams) {
    const response = await circleDeveloperSdk.createContractExecutionTransaction({
        walletId: _relayerWalletID,
        contractAddress: "0x5c107208EA989027fE88a5582e4062A23A53dC6e",
        abiFunctionSignature: "withdraw(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[14] memory input, bytes[] memory _payload, address[] memory _targetSC, uint256[] memory _payloadAmountPerCall)",
        abiParameters: _arrParams,
        fee: {
            type: 'level',
            config: {
                feeLevel: 'MEDIUM'
            }
        }
    });
    return response
}

async function transferTokens(_froWalletId, _toWalletId, _tokenId, _amount){
    const response = await circleDeveloperSdk.createTransaction({
        walletId: _froWalletId,
        tokenId: _tokenId,
        destinationAddress: _toWalletId,
        amounts: [_amount],
        fee: {
          type: 'level',
          config: {
            feeLevel: 'MEDIUM'
          }
        }
    });  
}

async function ercApprove(_walletId, _contractAddress, _arrParams) {
    const response = await circleDeveloperSdk.createContractExecutionTransaction({
        walletId: _walletId,
        contractAddress: _contractAddress,
        abiFunctionSignature: "approve(address spender, uint256 amount)",
        abiParameters: _arrParams,
        fee: {
            type: 'level',
            config: {
                feeLevel: 'MEDIUM'
            }
        }
    });
    return response.data
}

module.exports = {
    generateNewEntitySecret,
    getCirclePubKey,
    getEntityCipher,
    getEntityCipherWrap,
    createWalletSet,
    createWallet,
    checkWalletBalance,
    listWallets,
    getContract,
    depositNativeUP,
    settleZKP,
    transferTokens,
    ercApprove,
    depositERCUP
}