/** 
 * Example of supplying ETH to the Strike protocol with Strike.js
 *
 * Run ganache-cli in another command line window before running this script. Be
 *     sure to fork mainnet.

ganache-cli \
  -f https://mainnet.infura.io/v3/_YOUR_INFURA_ID_ \
  -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" \
  -i 1

 */

const Strike = require('../../dist/nodejs/index.js');
const privateKey = '0xb8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

const strike = new Strike('http://localhost:8545', { privateKey });

// Ethers.js overrides are an optional 3rd parameter for `supply`
const trxOptions = { gasLimit: 250000, mantissa: false };

(async function() {

  console.log('Supplying ETH to the Strike protocol...');
  const trx = await strike.supply(Strike.ETH, 1);
  console.log('Ethers.js transaction object', trx);

})().catch(console.error);
