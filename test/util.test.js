const assert = require('assert');
const util = require('../src/util.ts');

module.exports = function suite() {

  it('runs util.getAddress', async function () {
    const sEthAddress = '0xbEe9Cf658702527b0AcB2719c1FAA29EdC006a92';
    const result = util.getAddress('sETH');

    const expectedAddress = sEthAddress.toLowerCase();

    assert.equal(result.toLowerCase(), expectedAddress);
  });

  it('runs util.getAbi', async function () {
    const result = util.getAbi('sEther');

    const isArray = Array.isArray(result);

    assert.equal(isArray, true);
  });

  it('runs util.getNetNameWithChainId', async function () {
    const result = util.getNetNameWithChainId(3);

    const expectedResult ='ropsten';

    assert.equal(result, expectedResult);
  });

}