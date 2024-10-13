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
 *  Auxiliar functions to support the SurferMonkey SDK
 */

// 
/**
 * Converts string representations of big integers in an object or array into actual BigInt values.
 * 
 * @param {Object|Array|string} o - The input object, array, or string to convert.
 * @returns {Object|Array|BigInt|null} - The converted object, array, or BigInt value. Returns null for null input.
 * 
 */
function unstringifyBigInts(o) {
    if (typeof o === "string" && /^[0-9]+$/.test(o)) {
      return BigInt(o);
    } else if (typeof o === "string" && /^0x[0-9a-fA-F]+$/.test(o)) {
      return BigInt(o);
    } else if (Array.isArray(o)) {
      return o.map(unstringifyBigInts);
    } else if (typeof o === "object") {
      if (o === null) return null;
      const res = {};
      const keys = Object.keys(o);
      keys.forEach((k) => {
        res[k] = unstringifyBigInts(o[k]);
      });
      return res;
    } else {
      return o;
    }
  }
  
  module.exports = {
    unstringifyBigInts
  };
  