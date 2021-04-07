// Example of fetching a Strike protocol contract address with Strike.js
const Strike = require('../../dist/nodejs/index.js');

const strkAddress = Strike.util.getAddress(Strike.STRK);
const sSTRKAddress = Strike.util.getAddress(Strike.sSTRK);
const sETHAddressRopsten = Strike.util.getAddress(Strike.sETH, 'ropsten');

console.log('STRK (mainnet)', strkAddress);
console.log('sSTRK (mainnet)', sSTRKAddress);

console.log('sETH (ropsten)', sETHAddressRopsten);
