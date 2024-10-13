// CONFIDENTIAL.
// Copyright (c) 2024 by SurferMonkey. All rights reserved.

/*
 
 .d8888b.                    .d888                 888b     d888                   888                        
d88P  Y88b                  d88P"                  8888b   d8888                   888                        
Y88b.                       888                    88888b.d88888                   888                        
 "Y888b.   888  888 888d888 888888 .d88b.  888d888 888Y88888P888  .d88b.  88888b.  888  888  .d88b.  888  888 
    "Y88b. 888  888 888P"   888   d8P  Y8b 888P"   888 Y888P 888 d88""88b 888 "88b 888 .88P d8P  Y8b 888  888 
      "888 888  888 888     888   88888888 888     888  Y8P  888 888  888 888  888 888888K  88888888 888  888 
Y88b  d88P Y88b 888 888     888   Y8b.     888     888   "   888 Y88..88P 888  888 888 "88b Y8b.     Y88b 888 
 "Y8888P"   "Y88888 888     888    "Y8888  888     888       888  "Y88P"  888  888 888  888  "Y8888   "Y88888 
                                                                                                          888 
                                                                                                     Y8b d88P 
                                                                                                      "Y88P"
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo

*/

/**
 * The SurferMonkey SDK facilitates blockchain interactions specifically tailored for decentralized privacy-preserving applications.
 * This library includes methods for generating zero-knowledge proofs (ZKPs), managing blockchain deposits,
 * and handling secure, verifiable transactions. It is designed to simplify the complex processes involved in creating
 * and verifying ZKPs by providing high-level abstractions that interact seamlessly with blockchain technology.
 * Key functionalities include:
 * - createDeposit: From the user generated message it returns a deposit object.
 * - fetchZKPInputSignals: Retrieves necessary inputs for ZKP generation.
 * - createProof: Generates a zero-knowledge proof using the snarkjs library.
 * - createSoliditydata: Converts ZKP into format readable by Ethereum smart contracts.
 * This SDK is an essential tool for developers building on the SurferMonkey infrastructure, aiming to integrate regulatory privacy-preserving features 
 * into their decentralized applications.
 */

const snarkjs = require('snarkjs');
const axios = require('axios');
const SupportLib = require('./SurferMonkeyLibAux.js');

/**
 * Creates a deposit file by calling the backend to create the data structure.
 * 
 * @param {string} _BACKEND_RPC - The RPC endpoint to call the backend for creating the data structure.
 * @param {Object} _userMessage - The JSON object representing the user message as explained in the README.
 * @param {string} _pubKey - Public encryption key for encrypting the data.
 * @param {string} _institutionID - The ID of the institution.
 * @param {string} _chainID - The blockchain ID.
 * @returns {Promise<Object>} - A JSON object containing the structure of the Deposit Object or throws an error.
 * @throws {Error} - Throws an error if the request fails.
 */
async function createDeposit(_BACKEND_RPC, _userMessage, _pubKey, _institutionID, _chainID) {
  if (!_BACKEND_RPC || !_userMessage || !_pubKey || !_institutionID || !_chainID) {
    throw new Error("Missing required parameters for createDeposit.");
  }

  const uri = `${_BACKEND_RPC}counter/createDeposit`;
  try {
    const response = await axios.post(uri, _userMessage);
    const data = JSON.parse(response.data);
    data.pubEncryptKey = _pubKey;
    data.chainID = _chainID;
    data.institutionID = _institutionID;
    return data;
  } catch (err) {
   if (err.response && err.response.data && err.response.data.errors) {
     throw new Error(`Error createDeposit from backend: ${err.response.data.errors}`);
   } else {
     throw new Error(`Request failed: ${err.message}`);
   }
 }
}

/**
 * Generates the Zero-Knowledge Proof (ZKP) input signals by calling the backend.
 * 
 * @param {string} _BACKEND_RPC - The RPC endpoint to call the backend for creating the data structure.
 * @param {Object} depositJSON - The JSON object that was returned by the createDeposit() function.
 * @param {number} _targetLeafChild - The index of the target leaf in the Merkle Tree.
 * @returns {Promise<Object>} - An object containing the input signals for the ZKP or throws an error.
 * @throws {Error} - Throws an error if the request fails.
 */
async function fetchZKPInputSignals(_BACKEND_RPC, depositJSON, _targetLeafChild) {
  if (!_BACKEND_RPC || !depositJSON || _targetLeafChild === undefined) {
    throw new Error("Missing required parameters for fetchZKPInputSignals.");
  }

  depositJSON["targetLeafChild"] = _targetLeafChild;
  const uri = `${_BACKEND_RPC}counter/createZKPSignals`;

  try {
    const response = await axios.post(uri, depositJSON);
    return response.data;
  } catch (err) {
   if (err.response && err.response.data && err.response.data.errors) {
     throw new Error(`Error fetchZKPInputSignals from backend: ${err.response.data.errors}`);
   } else {
     throw new Error(`Request failed: ${err.message}`);
   }
 }
}

/**
 * Creates the Zero-Knowledge Proof (ZKP) by using the provided circuit and proving key.
 * 
 * @param {Object} _input - The input signals required for the ZKP generation.
 * @param {string} _circuit - The WASM file that contains the SurferMonkey ZKP Circuit.
 * @param {string} _provingKey - The proving key to match the SurferMonkey ZKP with the SurferMonkey Verifier Smart Contract.
 * @returns {Promise<Object>} - An object containing the proof and public signals or throws an error.
 * @throws {Error} - Throws an error if the proof generation fails.
 */
async function createProof(_input, _circuit, _provingKey) {
  if (!_input || !_circuit || !_provingKey) {
    throw new Error("Missing required parameters for createProof.");
  }

  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(_input, _circuit, _provingKey);
    return { proof, publicSignals };
  } catch (err) {
    throw new Error(`Failed to create proof: ${err.message}`);
  }
}

/**
 * Updates the User Intention Payload fields from the Deposit Object with the new updated Payload.
 * 
 * @param {string} _BACKEND_RPC - The backend RPC URL to call for creating the updated payload data.
 * @param {Object} _NewPayload - An object containing the new payload details.
 * @returns {Promise<Object>} - A new Deposit object with updated payload fields or throws an error.
 * @throws {Error} - Throws an error if the update request fails.
 */
async function GenerateNewPayloadData(_BACKEND_RPC, _NewPayload) {
  if (!_BACKEND_RPC || !_NewPayload) {
    throw new Error("Missing required parameters for GenerateNewPayloadData.");
  }

  const uri = `${_BACKEND_RPC}counter/newPayload`;

  try {
    const response = await axios.post(uri, _NewPayload);
    const data = JSON.parse(response.data);
    return data;
  } catch (err) {
   if (err.response && err.response.data && err.response.data.errors) {
     throw new Error(`Error GenerateNewPayloadData from backend: ${err.response.data.errors}`);
   } else {
     throw new Error(`Request failed: ${err.message}`);
   }
 }
}

/**
 * Converts the proof data created by snarkjs into readable parameters for the verifier smart contract.
 * 
 * @param {Array} proof - The proof array field from the ZKP object.
 * @param {Array} publicSignals - The publicSignals array field from the proof object.
 * @returns {Promise<Object>} - An object containing the converted proof data for Solidity or throws an error.
 * @throws {Error} - Throws an error if the conversion fails.
 */
async function createSoliditydata(proof, publicSignals) {
  if (!proof || !publicSignals) {
    throw new Error("Missing required parameters for createSoliditydata.");
  }

  try {
    const editedPublicSignals = SupportLib.unstringifyBigInts(publicSignals);
    const editedProof = SupportLib.unstringifyBigInts(proof);
    const callData = await snarkjs.groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    const argv = callData.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    const Input = argv.slice(8);
    return { a, b, c, Input };
  } catch (err) {
    throw new Error(`Failed to create Solidity data: ${err.message}`);
  }
}

module.exports = {
  createProof,
  createSoliditydata,
  createDeposit,
  fetchZKPInputSignals,
  GenerateNewPayloadData
};
