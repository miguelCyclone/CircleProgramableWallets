const ck = require('ckey'); //Load env variables
const util = require('util');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Paths to your CSV files
const digitalAssetPaymentPath = path.join(__dirname, '../db/data/sfsf.projman.model.db-DigitalAssetPayment.csv');
const employeePath = path.join(__dirname, '../db/data/sfsf.projman.model.db-Employee.csv');

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
    CHAIN_USED,
    UNIVERSAL_PLUGIN
} = Config;

const PRINT_YELLOW = "\x1b[33m%s\x1b[0m"

// Company that pays its employees
const WALLET_ID_COMPANY_EOA = "65618db5-4d6e-5e8c-b49c-872937e7ee61"
const WALLET_COMPANY_EOA = "0xc588ae311dd11fc1cd6c231ed1078fe24e310e9e"

// Relayer address
const WALLET_ID_RELAYER_EOA = "f6e665a0-0c69-5925-94c4-250b48f67f1f"
const WALLET_RELAYER_EOA = "0x5aef81f6838b9baae5da8c5506753cb5df7f7245"

// Function to get userId by employee name
function getUserIdByEmployeeName(filePath, employeeName) {
    return new Promise((resolve, reject) => {
      let found = false;
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => {
          if (data.defaultFullName.toLowerCase() === employeeName.toLowerCase()) {
            found = true;
            resolve(data.userId);
          }
        })
        .on('end', () => {
          if (!found) {
            resolve(null);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  // Function to read CSV file and find matching records
  function getWalletDataByUserId(filePath, userId) {
    return new Promise((resolve, reject) => {
      const results = [];
  
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => {
          if (data.userId === userId) {
            results.push(data);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  // Function to get wallet by employee name as a promise
  function getWalletByID(employeeName) {
    return getUserIdByEmployeeName(employeePath, employeeName)
      .then((userId) => {
        if (userId) {
          return getWalletDataByUserId(digitalAssetPaymentPath, userId).then((walletData) => {
            if (walletData.length > 0) {
              return { walletAddress: walletData[0].walletAddress, salary: walletData[0].salary };
            } else {
              throw new Error(`No wallet data found for user ID: ${userId}`);
            }
          });
        } else {
          throw new Error(`Employee ${employeeName} not found.`);
        }
      })
      .catch((error) => {
        console.error(error.message);
        return null;
      });
  }

async function main() {
    try {
        // GET DB Employee payroll
        const RICK = "Rick Smolla";
        const KAY = "Kay Holliston";
        const SARAH = "Sarah Lynn Moultone";

        const RICK_WALLET = await getWalletByID(RICK);
        const KAY_WALLET = await getWalletByID(KAY);
        const SARAH_WALLET = await getWalletByID(SARAH);

        if (!RICK_WALLET || !KAY_WALLET || !SARAH_WALLET) {
            throw new Error("Failed to retrieve wallet information for one or more employees.");
        }

        const RECIPIENT = RICK_WALLET.walletAddress;
        const RECIPIENT_TWO = KAY_WALLET.walletAddress;
        const RECIPIENT_THREE = SARAH_WALLET.walletAddress;

        // SurferMonkey Message parameters
        const AMOUNT_TOTAL = Number(RICK_WALLET.salary) + Number(KAY_WALLET.salary) + Number(SARAH_WALLET.salary) + ""; // Lock amount, e.g., 0.00001 of a native asset with 18 decimals

        const AMOUNT_CALL_ONE = RICK_WALLET.salary + ""; // Amount to be used on child output 1
        const AMOUNT_CALL_ONE_BATCH_ONE = AMOUNT_CALL_ONE; // amount to be used on the first batch from child output 1

        const AMOUNT_CALL_TWO = KAY_WALLET.salary + ""; // Amount to be used on child output 2
        const AMOUNT_CALL_ONE_BATCH_TWO = AMOUNT_CALL_TWO; // amount to be used on the first batch from child output 2

        const AMOUNT_CALL_THREE = SARAH_WALLET.salary + ""; // Amount to be used on child output 3
        const AMOUNT_CALL_ONE_BATCH_THREE = AMOUNT_CALL_THREE; // amount to be used on the first batch from child output 3

        NUMBER_TX_OUT = 3;

        // Blockchain function call details.
        const FUNCTION_HEADER = "function transfer(address recipient, uint256 amount)";
        const FUNCTION_NAME = "transfer";

        const ASSET_ID = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; // Circle
        const USDC_ADDRESS = ASSET_ID;

        // Define the smart contract address for the transaction.
        const TARGET_SC_ARR = [USDC_ADDRESS];

        // Define the amount of native asset used in each smart contract call. For a single call, this array contains one element.
        const payloadAmountPerCall = ["0"];

        const payloadObject_One = {
            functionHeader: FUNCTION_HEADER,
            functionName: FUNCTION_NAME,
            payloadParmsArr: [RECIPIENT, AMOUNT_CALL_ONE_BATCH_ONE]
        };

        const payloadObject_TWO = {
            functionHeader: FUNCTION_HEADER,
            functionName: FUNCTION_NAME,
            payloadParmsArr: [RECIPIENT_TWO, AMOUNT_CALL_ONE_BATCH_TWO]
        };

        const payloadObject_THREE = {
            functionHeader: FUNCTION_HEADER,
            functionName: FUNCTION_NAME,
            payloadParmsArr: [RECIPIENT_THREE, AMOUNT_CALL_ONE_BATCH_THREE]
        };

        // Array of payloads for each smart contract call. This example includes only one function call.
        const PAYLOAD_DATA_ARR_ONE = [payloadObject_One];
        const PAYLOAD_DATA_ARR_TWO = [payloadObject_TWO];
        const PAYLOAD_DATA_ARR_THREE = [payloadObject_THREE];

        const amountArr = [AMOUNT_CALL_ONE, AMOUNT_CALL_TWO, AMOUNT_CALL_THREE];
        const TARGET_SC_ARR_of_ARR = [TARGET_SC_ARR, TARGET_SC_ARR, TARGET_SC_ARR];
        const PAYLOAD_DATA_ARR_of_ARR = [PAYLOAD_DATA_ARR_ONE, PAYLOAD_DATA_ARR_TWO, PAYLOAD_DATA_ARR_THREE];
        const payloadAmountPerCall_ARR_of_ARR = [payloadAmountPerCall, payloadAmountPerCall, payloadAmountPerCall];

        // Step 0: Approve ERC20
        const approveParams = [UNIVERSAL_PLUGIN, AMOUNT_TOTAL];
        try {
            const approveTx = await CircleWallet.ercApprove(WALLET_ID_COMPANY_EOA, USDC_ADDRESS, approveParams);
            console.log(approveTx);
        } catch (error) {
            console.error(`Error during ERC20 approval: ${error.message}`);
            throw error;
        }

        // Wait for system synchronization and security updates
        console.log(PRINT_YELLOW, "Wait for ERC20 approval:");
        await DynamicHelpers.processWithTimedMessage(10000);

        const EOA = WALLET_COMPANY_EOA;
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
        };
        console.log(PRINT_YELLOW, "USER MESSAGE:");
        console.log(util.inspect(userMessage, { showHidden: false, depth: null, colors: true }));

        // Initiate deposit creation
        let deposit;
        try {
            deposit = await SurferMonkey.createDeposit(BACKEND_RPC, userMessage, PUB_KEY, INSTITUTION_ID, CHAIN_USED);
            if (deposit == false) throw new Error("Deposit creation failed");
        } catch (error) {
            console.error(`Error during deposit creation: ${error.message}`);
            throw error;
        }

        console.log(PRINT_YELLOW, "DEPOSIT:");
        console.log(util.inspect(deposit, { showHidden: false, depth: null, colors: true }));

        // Add the userMessage to store it in the file for debugging
        deposit.userMessage = userMessage;

        // Store the deposit data locally for debugging
        await DynamicHelpers.storeDeposit(deposit, "DepositUSDC");

        // Lock funds in SurferMonkey
        const paramsLockNative = [
            deposit.commitmentHashedHex,
            deposit.assetIDHEX,
            deposit.amountTotal
        ];

        let depositTx;
        try {
            depositTx = await CircleWallet.depositERCUP(WALLET_ID_COMPANY_EOA, paramsLockNative);
            console.log(depositTx.data);
        } catch (error) {
            console.error(`Error during deposit lock: ${error.message}`);
            throw error;
        }

        // Wait for system synchronization and security updates
        await DynamicHelpers.processWithTimedMessage(10000);

        for (let i = 0; i < payloadAmountPerCall_ARR_of_ARR.length; i++) {
            try {
                console.log(PRINT_YELLOW, "Processing Payment idx: ", i);
                const targetLeafChild = i; // Which child output we want to use
                // 3. Generate Zero-Knowledge Proof (ZKP)
                // Generate ZKP Input Signals
                const ZKP_INPUT_SIGNALS = await SurferMonkey.fetchZKPInputSignals(BACKEND_RPC, deposit, targetLeafChild);
                if (ZKP_INPUT_SIGNALS.flag == false) throw new Error("Failed to fetch ZKP input signals");
                console.log(PRINT_YELLOW, "ZKP_INPUT_SIGNALS", ZKP_INPUT_SIGNALS);

                const ZKP = await SurferMonkey.createProof(ZKP_INPUT_SIGNALS, CIRCUIT, PROVING_KEY);
                if (ZKP.flag == false) throw new Error("Failed to create ZKP");

                // Convert the ZKP into Solidity readable data
                const zkpSolidityData = await SurferMonkey.createSoliditydata(ZKP.proof, ZKP.publicSignals);

                // Settle ZKP
                const paramSettleZKP = [
                    zkpSolidityData.a,
                    zkpSolidityData.b,
                    zkpSolidityData.c,
                    zkpSolidityData.Input,
                    deposit.depositArr[targetLeafChild].payloadData,
                    deposit.depositArr[targetLeafChild].targetSC,
                    deposit.depositArr[targetLeafChild].payloadAmountPerCall
                ];

                let zkpSettledTx = await CircleWallet.settleZKP(WALLET_ID_RELAYER_EOA, paramSettleZKP);
                if (zkpSettledTx.flag == false) throw new Error("Failed to settle ZKP");
                console.log(PRINT_YELLOW, "Waiting for ZKP to get settled...");
                await DynamicHelpers.processWithTimedMessage(10000);
                console.log("Transaction successfully completed and ZKP settled.");
            } catch (error) {
                console.error(`Error during ZKP processing for payment index ${i}: ${error.message}`);
                throw error;
            }
        }
        console.log("Script finished");
        return 1;
    } catch (error) {
        console.error(`Error in main function: ${error.message}`);
    }
}

main()

/*
module.exports = {
    getWalletByID,
    main, // Exporting main function
};
*/