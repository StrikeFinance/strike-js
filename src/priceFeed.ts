/**
 * @file Price Feed
 * @desc These methods facilitate interactions with the Open Price Feed smart
 *     contracts.
 */

import * as eth from './eth';
import { netId } from './helpers';
import {
  constants, address, abi, cTokens, underlyings, decimals, opfAssets
} from './constants';
import { BigNumber } from '@ethersproject/bignumber/lib/bignumber';
import { CallOptions } from './types';

function validateAsset(
  asset: string,
  argument: string,
  errorPrefix: string
) : (boolean | string | number)[] {
  if (typeof asset !== 'string' || asset.length < 1) {
    throw Error(errorPrefix + 'Argument `' + argument + '` must be a non-empty string.');
  }

  const assetIsSToken = asset[0] === 's';

  const sTokenName = assetIsSToken ? asset : 's' + asset;
  const sTokenAddress = address[this._network.name][sTokenName];

  let underlyingName = assetIsSToken ? asset.slice(1, asset.length) : asset;
  const underlyingAddress = address[this._network.name][underlyingName];

  if (
    (!cTokens.includes(sTokenName) || !underlyings.includes(underlyingName)) &&
    !opfAssets.includes(underlyingName)
  ) {
    throw Error(errorPrefix + 'Argument `' + argument + '` is not supported.');
  }

  const underlyingDecimals = decimals[underlyingName];

  // The open price feed reveals BTC, not WBTC.
  underlyingName = underlyingName === 'WBTC' ? 'BTC' : underlyingName;

  return [assetIsSToken, sTokenName, sTokenAddress, underlyingName, underlyingAddress, underlyingDecimals];
}

async function sTokenExchangeRate(
  sTokenAddress: string,
  sTokenName: string,
  underlyingDecimals: number
) : Promise<number> {
  const address = sTokenAddress;
  const method = 'exchangeRateCurrent';
  const options = {
    _compoundProvider: this._provider,
    abi: sTokenName === constants.sETH ? abi.sETH : abi.sErc20,
  };
  const exchangeRateCurrent = await eth.read(address, method, [], options);
  const mantissa = 18 + underlyingDecimals - 8; // sToken always 8 decimals
  const oneSTokenInUnderlying = exchangeRateCurrent / Math.pow(10, mantissa);

  return oneSTokenInUnderlying;
}

/**
 * Gets an asset's price from the Strike Protocol open price feed. The price
 *    of the asset can be returned in any other supported asset value, including
 *    all sTokens and underlyings.
 *
 * @param {string} asset A string of a supported asset in which to find the
 *     current price.
 * @param {string} [inAsset] A string of a supported asset in which to express
 *     the `asset` parameter's price. This defaults to USD.
 *
 * @returns {string} Returns a string of the numeric value of the asset.
 *
 * @example
 * ```
 * const strike = new Strike(window.ethereum);
 * let price;
 * 
 * (async function () {
 * 
 *   price = await strike.getPrice(Strike.ETH);
 *   console.log('ETH in USD', price);
 * 
 *   price = await strike.getPrice(Strike.STRK, Strike.USDC); // supports sTokens too
 *   console.log('STRK in USDC', price);
 * 
 * })().catch(console.error);
 * ```
 */
export async function getPrice(
  asset: string,
  inAsset: string = constants.USDC
) : Promise<number> {
  await netId(this);
  const errorPrefix = 'Strike [getPrice] | ';

  const [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    assetIsSToken, sTokenName, sTokenAddress, underlyingName, underlyingAddress, underlyingDecimals
  ] = validateAsset.bind(this)(asset, 'asset', errorPrefix);

  const [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    inAssetIsSToken, inAssetSTokenName, inAssetSTokenAddress, inAssetUnderlyingName, inAssetUnderlyingAddress, inAssetUnderlyingDecimals
  ] = validateAsset.bind(this)(inAsset, 'inAsset', errorPrefix);

  // const priceFeedAddress = address[this._network.name].PriceFeed;
  const comptrollerAddress = address[this._network.name].Comptroller;

  const oracleTrxOptions: CallOptions = {
    _compoundProvider: this._provider,
    abi: abi.Comptroller,
  };
  const priceOracleAddress = await eth.read(comptrollerAddress, 'oracle', [], oracleTrxOptions);

  // const trxOptions: CallOptions = {
  //   _compoundProvider: this._provider,
  //   abi: abi.PriceFeed,
  // };

  // const assetUnderlyingPrice = await eth.read(priceFeedAddress, 'price', [ underlyingName ], trxOptions);
  // const inAssetUnderlyingPrice =  await eth.read(priceFeedAddress, 'price', [ inAssetUnderlyingName ], trxOptions);

  const trxOptions: CallOptions = {
    _compoundProvider: this._provider,
    abi: abi.PriceOracle,
  };
  let assetUnderlyingPrice = await eth.read(priceOracleAddress, 'getUnderlyingPrice', [ sTokenAddress ], trxOptions);
  const inAssetUnderlyingPrice =  await eth.read(priceOracleAddress, 'getUnderlyingPrice', [ inAssetSTokenAddress ], trxOptions);

  const assetDecimal = decimals[asset];
  const inAssetDecimal = decimals[inAsset];
  if ((assetDecimal-inAssetDecimal) > 0) {
    assetUnderlyingPrice = assetUnderlyingPrice.mul(BigNumber.from("10").pow(assetDecimal-inAssetDecimal));
  } else {
    assetUnderlyingPrice = assetUnderlyingPrice.div(BigNumber.from("10").pow(inAssetDecimal-assetDecimal));
  }  

  let assetSTokensInUnderlying, inAssetSTokensInUnderlying;

  if (assetIsSToken) {
    assetSTokensInUnderlying = await sTokenExchangeRate.bind(this)(sTokenAddress, sTokenName, underlyingDecimals);
  }

  if (inAssetIsSToken) {
    inAssetSTokensInUnderlying = await sTokenExchangeRate.bind(this)(inAssetSTokenAddress, inAssetSTokenName, inAssetUnderlyingDecimals);
  }

  let result;
  if (!assetIsSToken && !inAssetIsSToken) {
    result = assetUnderlyingPrice / inAssetUnderlyingPrice;
  } else if (assetIsSToken && !inAssetIsSToken) {
    const assetInOther = assetUnderlyingPrice / inAssetUnderlyingPrice;
    result = assetInOther * assetSTokensInUnderlying;
  } else if (!assetIsSToken && inAssetIsSToken) {
    const assetInOther = assetUnderlyingPrice / inAssetUnderlyingPrice;
    result = assetInOther / inAssetSTokensInUnderlying;
  } else {
    const assetInOther = assetUnderlyingPrice / inAssetUnderlyingPrice;
    const sTokensInUnderlying = assetInOther / assetSTokensInUnderlying;
    result = inAssetSTokensInUnderlying * sTokensInUnderlying;
  }

  return result;
}
