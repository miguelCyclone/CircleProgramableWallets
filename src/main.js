const ck = require('ckey'); //Load env variables
const util = require('util');
const CircleWallet = require('./tools/CircleWalletAux.js')
const DynamicHelpers = require('./libs/DynamicHelpers.js');
const Config = require('./config.js');
// The PATH is from the relative path where it is called from: In this case Circuit and Proving Key are been called from the scripts inside the test folder
const CIRCUIT = '../src/res/circuit/withdraw.wasm'
const PROVING_KEY = "../src/res/circuit/withdraw_0001.zkey"

// SurferMonkey SDK
const SurferMonkey = require('../SDK/SurferMonkeyLib.js')

const {
    CIRCLE_API,
    ENTITY_SECRET,
    WALLET_SET_ID,
    BACKEND_RPC
} = process.env;

const {
    PUB_KEY,
    INSTITUTION_ID,
    CHAIN_USED
} = Config;

const PRINT_YELLOW = "\x1b[33m%s\x1b[0m"

const WALLET_ID_ALICE_EOA = "1da38fce-63c4-5d90-93b3-90cca4510984"
const WALLET_ALICE_EOA = "0x47ea51c9dc2e2b700eb0f499675ae9439feca744"

const WALLET_ID_BOB = "e74e6beb-0d48-52a1-82dd-7311bbb5e92d"
const WALLET_BOB = "0x354eb3d039a45251431360863434866537a3555b"

const WALLET_ID_RELAYER_EOA = "f6e665a0-0c69-5925-94c4-250b48f67f1f"
const WALLET_RELAYER_EOA = "0x5aef81f6838b9baae5da8c5506753cb5df7f7245"

//
// SurferMonkey Message parameters
//

// Input Publick Lock parameters -> This is the asset amount that you are locking into SurferMonkey Universal Plugin
const AMOUNT_TOTAL = "10000000000000" // Lock amount, e.g., 0.00001 of a native asset with 18 decimals
const AMOUNT_CALL_ONE = AMOUNT_TOTAL // Amount to be used on child output 1
const AMOUNT_CALL_ONE_BATCH_ONE = AMOUNT_TOTAL // amount to be used on the first batch from child output 1

const ASSET_ID = "0x0000000000000000000000000000000000000000000000000000000000000000"

NUMBER_TX_OUT = 1

// Blockchain function call details.
const FUNCTION_HEADER = "function transferEth(address targetAddress, uint256 amount)"
const FUNCTION_NAME = "transferEth"

const proxySCAddress = "0xED31AfA3CDA4353d6BA1be00A2DB2F0a6bFa4dcd"

// Define the smart contract address for the transaction.
const TARGET_SC_ARR = [proxySCAddress];

// Define the amount of native asset used in each smart contract call. For a single call, this array contains one element.
const payloadAmountPerCall = [AMOUNT_CALL_ONE_BATCH_ONE];

// Configure the payload for the blockchain function call. This includes the function header, name, and parameters.
const RECIPIENT = WALLET_BOB; 

const payloadObject_One = {
    functionHeader: FUNCTION_HEADER,
    functionName: FUNCTION_NAME,
    payloadParmsArr: [RECIPIENT, AMOUNT_CALL_ONE_BATCH_ONE] 
};

// Array of payloads for each smart contract call. This example includes only one function call.
const PAYLOAD_DATA_ARR = [payloadObject_One];

const amountArr = [AMOUNT_CALL_ONE]
const TARGET_SC_ARR_of_ARR = [TARGET_SC_ARR]
const PAYLOAD_DATA_ARR_of_ARR = [PAYLOAD_DATA_ARR]
const payloadAmountPerCall_ARR_of_ARR = [payloadAmountPerCall]

const targetLeafChild = 0 // Which child output we want to use

async function main(){   
    const EOA = WALLET_ALICE_EOA
    // 1. Create and configure the user message
    const userMessage = {
        amountArr: amountArr,
        amountTotal: AMOUNT_TOTAL,
        assetID: ASSET_ID,
        payload_dataArrOfArr: PAYLOAD_DATA_ARR_of_ARR,
        targetSCArrOfArr: TARGET_SC_ARR_of_ARR,
        payloadAmountPerCallArrOfArr: payloadAmountPerCall_ARR_of_ARR,
        userEOA: EOA,
        numberOut: NUMBER_TX_OUT
    }
    console.log(PRINT_YELLOW, "USER MESSAGE:")
    console.log(util.inspect(userMessage, { showHidden: false, depth: null, colors: true }));

    // Initiate deposit creation
    let deposit = await SurferMonkey.createDeposit(BACKEND_RPC, userMessage, PUB_KEY, INSTITUTION_ID, CHAIN_USED);
    if (deposit == false) process.exit(1);

    console.log(PRINT_YELLOW, "DEPOSIT:")
    console.log(util.inspect(deposit, { showHidden: false, depth: null, colors: true }));

    // Add the userMessage to store it in the file for debugging
    deposit.userMessage = userMessage

    // Store the deposit data locally for debugging
    await DynamicHelpers.storeDeposit(deposit, "DepositNative");

    // Lock funds in SurferMonkey
    const paramsLockNative = [
        deposit.commitmentHashedHex
    ]

    const depositTx = await CircleWallet.depositNativeUP(WALLET_ID_ALICE_EOA, paramsLockNative, AMOUNT_TOTAL)
    console.log(depositTx.data)

    // Wait for system synchronization and security updates
    await DynamicHelpers.processWithTimedMessage(10000);

    // 3. Generate Zero-Knowledge Proof (ZKP)
    // Generate ZKP Input Signals
    const ZKP_INPUT_SIGNALS = await SurferMonkey.fetchZKPInputSignals(BACKEND_RPC, deposit, targetLeafChild)
    if (ZKP_INPUT_SIGNALS.flag == false) process.exit(1);
    console.log(PRINT_YELLOW, "ZKP_INPUT_SIGNALS", ZKP_INPUT_SIGNALS)

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
        deposit.depositArr[targetLeafChild].payloadData,
        deposit.depositArr[targetLeafChild].targetSC,
        deposit.depositArr[targetLeafChild].payloadAmountPerCall
    ]

    let zkpSettledTx = await CircleWallet.settleZKP(WALLET_ID_RELAYER_EOA, paramSettleZKP)
    if (zkpSettledTx.flag == false) process.exit(1);

    console.log("Transaction successfully completed and ZKP settled.");
    process.exit(0);
}

main()