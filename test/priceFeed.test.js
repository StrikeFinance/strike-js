const assert = require('assert');
const ethers = require('ethers');
const Strike = require('../src/index.ts');
const { request } = require('../src/util.ts');
const providerUrl = 'http://localhost:8545';

function wait(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

module.exports = function suite([ publicKeys, privateKeys ]) {

  const strike = new Strike(providerUrl);

  it('runs priceFeed.getPrice underlying asset to USD', async function () {
    const strike = new Strike(providerUrl);

    const price = await strike.getPrice(Strike.WBTC);

    const isPositiveNumber = price > 0;

    assert.equal(typeof price, 'number');
    assert.equal(isPositiveNumber, true);
  });

  it('runs priceFeed.getPrice underlying asset to underlying asset', async function () {
    const strike = new Strike(providerUrl);

    const price = await strike.getPrice(Strike.UNI, Strike.WBTC);

    const isPositiveNumber = price > 0;

    assert.equal(typeof price, 'number');
    assert.equal(isPositiveNumber, true);

  });

  it('runs priceFeed.getPrice sToken to underlying asset', async function () {
    const strike = new Strike(providerUrl);

    const price = await strike.getPrice(Strike.sBUSD, Strike.WBTC);

    const isPositiveNumber = price > 0;
    const isLessThanOne = price < 1;

    assert.equal(typeof price, 'number');
    assert.equal(isPositiveNumber, true);
    assert.equal(isLessThanOne, true);
  });

  it('runs priceFeed.getPrice underlying asset to sToken', async function () {
    const strike = new Strike(providerUrl);

    const price = await strike.getPrice(Strike.UNI, Strike.sBUSD);

    const isPositiveNumber = price > 0;

    assert.equal(typeof price, 'number');
    assert.equal(isPositiveNumber, true);
  });
/*
  it('runs priceFeed.getPrice sToken to sToken', async function () {
    const strike = new Strike(providerUrl);

    const price = await strike.getPrice(Strike.sBUSD, Strike.sUSDC);

    const isPositiveNumber = price > 0;
    const isOne = price === 1;

    assert.equal(typeof price, 'number');
    assert.equal(isPositiveNumber, true);
    assert.equal(isOne, true);
  });
*/
  it('runs priceFeed.getPrice for BUSD', async function () {
    const strike = new Strike(providerUrl);

    let price;
    try {
      price = await strike.getPrice(Strike.BUSD);
      // console.log('BUSD', 'price', price);
    } catch (error) {
      console.error(error);
    }

    assert.equal(typeof price, 'number', 'Ensure returned object is a number');
    assert.equal(price > 0, true, 'Ensure the returned price is > 0');

  });

}
