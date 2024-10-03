const ck = require('ckey'); //Load env variables
const CircleWallet = require('./tools/CircleWalletAux.js')

const {
    CIRCLE_API,
    ENTITY_SECRET,
    WALLET_SET_ID,
    BACKEND_RPC
} = process.env;

// Account Type
const SCA = 'SCA'
const EOA = 'EOA'

// Network
const MATIC_AMOY = 'MATIC-AMOY'
const AVAX_FUJI = 'AVAX-FUJI'

const nativeAssetID = "0c8f8485-f74f-5e28-80f2-3cc4e80ef71c"

const WALLET_ID_ALICE = "ec576a71-765b-5def-ba74-1832cc8a7b09"
const WALLET_ALICE = "0x57f1c2d2125fbc6aebb243821edef6ef0a39f797"

const WALLET_ID_ALICE_EOA = "1da38fce-63c4-5d90-93b3-90cca4510984"
const WALLET_ALICE_EOA = "0x47ea51c9dc2e2b700eb0f499675ae9439feca744"

async function main(){
    const walletSetFabric = 'Entity WalletSet A'
    //const wallets = await CircleWallet.createWallet(EOA, [MATIC_AMOY], WALLET_SET_ID)
    //console.log(wallets)
    
    
    /*const balanceAlice = await CircleWallet.checkWalletBalance(WALLET_ID_ALICE)
    console.log(JSON.stringify(balanceAlice, null, 2));*/

    CircleWallet.transferTokens(WALLET_ID_ALICE, WALLET_ALICE_EOA, nativeAssetID, "4.8")
}

main()