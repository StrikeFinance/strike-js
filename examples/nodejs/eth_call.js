// Example of calling JSON RPC's eth_call with Strike.js
const Strike = require('../../dist/nodejs/index.js');

const sSTRKAddress = Strike.util.getAddress(Strike.sSTRK);

(async function() {

  const srpb = await Strike.eth.read(
    sSTRKAddress,
    'function supplyRatePerBlock() returns (uint256)',
    // [], // [optional] parameters
    // {}  // [optional] call options, provider, network, plus ethers "overrides"
  );

  console.log('sSTRK market supply rate per block:', srpb.toString());

})().catch(console.error);
