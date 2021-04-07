// TODO: Needs babel config in parent dir, that currently messes with the build
// process so I deleted it.
// TODO: Get mock working for ethers so we don't make real calls during tests.

import Strike from '../src/index';

test('Strike constructor', async () => {
  const strike = new Strike('http://localhost:8545');

  console.log(strike.keys);
  expect(strike).toBe(true);
});
