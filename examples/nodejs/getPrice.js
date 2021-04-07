// Example of fetching prices from the Strike protocol's open price feed using
// Strike.js
const Strike = require('../../dist/nodejs/index.js');
const strike = new Strike();

let price;
(async function() {

  price = await strike.getPrice(Strike.STRK);
  console.log('STRK in USDC', price);

  price = await strike.getPrice(Strike.sSTRK);
  console.log('sSTRK in USDC', price);

  price = await strike.getPrice(Strike.STRK, Strike.sUSDC);
  console.log('STRK in sUSDC', price);

  price = await strike.getPrice(Strike.STRK, Strike.ETH);
  console.log('STRK in ETH', price);

})().catch(console.error);
