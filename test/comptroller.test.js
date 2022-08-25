const assert = require('assert');
const ethers = require('ethers');
const comptroller = require('../src/comptroller.ts');
const Strike = require('../src/index.ts');
const providerUrl = 'http://localhost:8545';

module.exports = function suite([ publicKeys, privateKeys ]) {

  const acc1 = { address: publicKeys[0], privateKey: privateKeys[0] };

  it('runs comptroller.enterMarkets single asset', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const trx = await strike.enterMarkets(Strike.ETH);
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const event = receipt.events[0].event;

    const numEventsExpected = 1;
    const eventExpected = 'MarketEntered';

    assert.equal(numEvents, numEventsExpected);
    assert.equal(event, eventExpected);
  });

  it('runs comptroller.enterMarkets multiple assets', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const trx = await strike.enterMarkets(
      [ Strike.BUSD, Strike.USDC, Strike.UNI ]
    );
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const event = receipt.events[0].event;

    const numEventsExpected = 3;
    const eventExpected = 'MarketEntered';

    assert.equal(numEvents, numEventsExpected);
    assert.equal(event, eventExpected);
  });

  it('fails comptroller.enterMarkets sToken string', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [enterMarkets] | Argument `markets` must be an array or string.';
    try {
      const trx = await strike.enterMarkets(null);
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails comptroller.enterMarkets invalid sToken', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [enterMarkets] | Provided market `sbadstokenname` is not a recognized sToken.';
    try {
      const trx = await strike.enterMarkets(['USDC', 'badstokenname']);
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('runs comptroller.exitMarket', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const enterMarketsTrx = await strike.enterMarkets(Strike.ETH);
    await enterMarketsTrx.wait(1);

    const trx = await strike.exitMarket(Strike.ETH);
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const event = receipt.events[0].event;

    const numEventsExpected = 1;
    const eventExpected = 'MarketExited';

    assert.equal(numEvents, numEventsExpected);
    assert.equal(event, eventExpected);
  });

  it('fails comptroller.exitMarket sToken string', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [exitMarket] | Argument `market` must be a string of a sToken market name.';
    try {
      const trx = await strike.exitMarket(null);
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails comptroller.exitMarket invalid sToken', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [exitMarket] | Provided market `sbadstokenname` is not a recognized sToken.';
    try {
      const trx = await strike.exitMarket('badstokenname');
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

}
