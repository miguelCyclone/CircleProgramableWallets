const ck = require('ckey'); //Load env variables
const CircleWallet = require('./tools/CircleWalletAux.js')
const DynamicHelpers = require('./libs/DynamicHelpers.js');
// The PATH is from the relative path where it is called from: In this case Circuit and Proving Key are been called from the scripts inside the test folder
const CIRCUIT = '../src/res/circuit/withdraw.wasm'
const PROVING_KEY = "../src/res/circuit/withdraw_0001.zkey"

// SurferMonkey SDK
const SurferMonkey = require('../SDK/SurferMonkeyLib.js')
const auxSDK = require('../Aux/aux.js')

const {
    CIRCLE_API,
    ENTITY_SECRET,
    WALLET_SET_ID,
    BACKEND_RPC
} = process.env;


const WALLET_ID_ALICE_EOA = "1da38fce-63c4-5d90-93b3-90cca4510984"
const WALLET_ALICE_EOA = "0x47ea51c9dc2e2b700eb0f499675ae9439feca744"

const WALLET_ID_BOB = "e74e6beb-0d48-52a1-82dd-7311bbb5e92d"
const WALLET_BOB = "0x354eb3d039a45251431360863434866537a3555b"

const WALLET_ID_RELAYER_EOA = "f6e665a0-0c69-5925-94c4-250b48f67f1f"
const WALLET_RELAYER_EOA = "0x5aef81f6838b9baae5da8c5506753cb5df7f7245"

const SurferMonkeyUP5_ID = "01924f4d-94ef-733f-a645-61962a9cd6c0"

//
// SurferMonkey Message parameters
//

// Input Publick Lock parameters -> This is the asset amount that you are locking into SurferMonkey Universal Plugin
const AMOUNT = "10000000000000" // Lock amount, e.g., 0.00001 of a native asset with 18 decimals.
const decimals = 18 // We Lock Native asset, so we obtain the Native decimals from EVM
const amountDecimal = BigInt(AMOUNT) / BigInt(decimals)
const amountDecimalString = amountDecimal+""
const SELECTED_FUNC = 1 // Select 1 for native asset transactions
const PROXY_SC_ADDR = "0x6A37688Dc38b1bCCEE5D867873d2eb960C6B1d31"
const UniversalPluginAdress = "0xA953D246D93c64B874217231108e5e4100C57B51"
const UniversalPluginGlobalHash = "0xe7152352d5b3d8ff2885f35ce0fc2288968bd3805bd143d613ce4923e9dee3e4"

// Blockchain function call details.
const FUNCTION_HEADER = "function transferEth(address targetAddress, uint256 amount)"
const FUNCTION_NAME = "transferEth"

// Parameters for the deposit transaction.
const depositPublicDataParams = {
    amount: AMOUNT,
    func: SELECTED_FUNC
};

// Define the smart contract address for the transaction.
const TARGET_SC_ARR = [PROXY_SC_ADDR];

// Define the amount of native asset used in each smart contract call. For a single call, this array contains one element.
const payloadAmountPerCall = [AMOUNT];

// Configure the payload for the blockchain function call. This includes the function header, name, and parameters.
const RECIPIENT = WALLET_BOB; 

const payloadObject_One = {
    functionHeader: FUNCTION_HEADER,
    functionName: FUNCTION_NAME,
    payloadParmsArr: [RECIPIENT, AMOUNT] 
};

// Array of payloads for each smart contract call. This example includes only one function call.
const PAYLOAD_DATA_ARR = [payloadObject_One];


async function main(){   

    // 1. Create and configure the user message
    const userMessage = auxSDK.createUserMessage(
        WALLET_ALICE_EOA,
        SELECTED_FUNC,
        UniversalPluginAdress,
        UniversalPluginGlobalHash,
        decimals,
        depositPublicDataParams,
        payloadAmountPerCall,
        TARGET_SC_ARR,
        PAYLOAD_DATA_ARR,
        '2',
        '2'
    )

    // Initiate deposit creation
    let deposit = await SurferMonkey.createDeposit(BACKEND_RPC, userMessage, SurferMonkey.PUB_KEY);
    if (deposit.flag == false) process.exit(1);

    // Add the userMessage to store it in the file for debugging
    deposit.userMessage = userMessage

    // Store the deposit data locally for debugging
    await DynamicHelpers.storeDeposit(deposit, "DepositNative");

    // Lock funds in SurferMonkey
    const paramsLockNative = [
        deposit.commitmentFixedHex,
        deposit.traceFixedHex
    ]

    const depositTx = await CircleWallet.depositNativeUP(WALLET_ID_ALICE_EOA, paramsLockNative, amountDecimalString)
    console.log(depositTx.data)

    // Wait for system synchronization and security updates
    await DynamicHelpers.processWithTimedMessage(60000);

    // 3. Generate Zero-Knowledge Proof (ZKP)
    // Generate ZKP Input Signals
    const ZKP_INPUT_SIGNALS = await SurferMonkey.fetchZKPInputSignals(BACKEND_RPC, deposit)
    if (ZKP_INPUT_SIGNALS.flag == false) process.exit(1);

    const ZKP = await SurferMonkey.createProof(ZKP_INPUT_SIGNALS, CIRCUIT, PROVING_KEY)
    if (ZKP.flag == false) process.exit(1);

    // Convert the ZKP into Solidity readable data
    const zkpSolidityData = await SurferMonkey.createSoliditydata(ZKP.proof, ZKP.publicSignals)

    // Settle ZKP
    const paramSettleZKP = [
        zkpSolidityData.a,
        zkpSolidityData.b,
        zkpSolidityData.c,
        zkpSolidityData.Input,
        deposit.payloadData,
        deposit.targetSC,
        deposit.payloadAmountPerCall,
        deposit.userPublicData,
        deposit.dAppGlobalHash,
        SELECTED_FUNC   
    ]
    let zkpSettledTx = await CircleWallet.settleZKP(WALLET_ID_RELAYER_EOA, paramSettleZKP)
    if (zkpSettledTx.flag == false) process.exit(1);

    console.log("Transaction successfully completed and ZKP settled.");
    process.exit(0);
}

main()