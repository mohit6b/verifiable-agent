import React, { useState } from 'react';
import { ethers } from 'ethers';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as snarkjs from 'snarkjs';
import circuitWasm from './diff.wasm?url';
import provingKey from './diff_0001.zkey?url';
import verifyKey from './verification_key.json'
import ethChainOracleABI from './abis/ethOracleAbi.json';
import polygonChainOracleABI from './abis/polygonOracleAbi.json';
import verifierABI from './abis/verifierAbi.json';
import emailjs from 'emailjs-com';

// Contract addresses
const ETH_CHAIN_ORACLE_ADDRESS = import.meta.env.VITE_ETH_CHAIN_ORACLE_ADDRESS!;
const POLYGON_CHAIN_ORACLE_ADDRESS = import.meta.env.VITE_POLYGON_CHAIN_ORACLE_ADDRESS!;
const VERIFIER_ADDRESS = import.meta.env.VITE_VERIFIER_ADDRESS!;

function App() {
  const [ethChainPrice, setethChainPrice] = useState<string>('');
  const [poygonChainPrice, setpolygonChainPrice] = useState<string>('');
  const [priceDiff, setPriceDiff] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [threshold, setThreshold] = useState<string>('');
  const [verificationState, setVerificationState] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const getethChainPrice = async () => {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_SEP_INFURA_API);
      const contract = new ethers.Contract(ETH_CHAIN_ORACLE_ADDRESS, ethChainOracleABI, provider);
      const price = await contract.getChainlinkDataFeedLatestAnswer();
      setethChainPrice(ethers.formatUnits(price, 8));
      setError('');
    } catch (err) {
      setError('Failed to fetch Ethereum price');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getpoygonChainPrice = async () => {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_AMOY_INFURA_API);
      const contract = new ethers.Contract(POLYGON_CHAIN_ORACLE_ADDRESS, polygonChainOracleABI, provider);
      const price = await contract.getChainlinkDataFeedLatestAnswer();
      setpolygonChainPrice(ethers.formatUnits(price, 8));
      setError('');
    } catch (err) {
      setError('Failed to fetch Polygon price');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBothPrices = async () => {
    const eth_provider = new ethers.JsonRpcProvider(import.meta.env.VITE_SEP_INFURA_API);
    const eth_contract = new ethers.Contract(ETH_CHAIN_ORACLE_ADDRESS, ethChainOracleABI, eth_provider);
    const ethChainPrice = await eth_contract.getChainlinkDataFeedLatestAnswer();
    setethChainPrice(ethers.formatUnits(ethChainPrice, 8));

    const polygon_provider = new ethers.JsonRpcProvider(import.meta.env.VITE_AMOY_INFURA_API);
    const polygon_contract = new ethers.Contract(POLYGON_CHAIN_ORACLE_ADDRESS, polygonChainOracleABI, polygon_provider);
    const poygonChainPrice = await polygon_contract.getChainlinkDataFeedLatestAnswer();
    setpolygonChainPrice(ethers.formatUnits(poygonChainPrice, 8));

    // await Promise.all([getethChainPrice(), getpoygonChainPrice()]);

    const ethChainPriceSats = Math.round(parseFloat(ethChainPrice) );
    const polygonChainPriceSats = Math.round(parseFloat(poygonChainPrice));
    const diff = Math.abs(ethChainPriceSats - polygonChainPriceSats);
    setPriceDiff(diff.toString());
    // const diff = Math.abs(parseFloat(ethChainPrice) - parseFloat(poygonChainPrice));
    // setPriceDiff(diff.toFixed(8));
  };

  const verifyThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);


      const input = {
        in: [parseInt(threshold), parseInt(priceDiff)]
      };

      console.log("Input: ", input);

      // Load the circuit
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        circuitWasm,
        provingKey
      );

      console.log("Proof: ", proof);
      console.log("Public Signals: ", publicSignals);

      console.log("verifyKey: ", verifyKey);

      // var verified = await snarkjs.groth16.verify(verifyKey, publicSignals, proof);

      // console.log("Verification Status: ", verified);

      const calldataString = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

      const calldata = JSON.parse(`[${calldataString}]`);
      const [pA, pB, pC, pubSignals] = calldata;

      console.log("calldataString : ", calldataString);

      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_AMOY_INFURA_API);
      const contract = new ethers.Contract(VERIFIER_ADDRESS, verifierABI, provider);
      const verified = await contract.verifyProof(pA, pB, pC, pubSignals);

      console.log("Verification: ", verified);


      if (verified) {
        setVerificationState('Proof verified successfully!');
      } else {
        console.log("Trying sent successfully!");

        // ✅ Send email notification
        const emailParams = {
          to_email: email,
          subject: "ZK Proof Verification Successful",
          message: `Your proof has been verified successfully! 🎉\n\nThreshold: ${threshold}\nPrice Difference: ${priceDiff}`,
        };
  
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID!,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID!,
          emailParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY!
        );
  
        console.log("Email sent successfully!");

        setVerificationState('Proof verification failed!');

      }
    } catch (err) {
      setVerificationState('Failed to verify proof');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Arbitrage Finder</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="p-4 border rounded-md">
              <button
                onClick={getethChainPrice}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  'Fetch Price of BTC/USD on Uniswap Ethereum'
                )}
              </button>
              {ethChainPrice && (
                <p className="mt-2 text-center">BTC/USD(ETH) Price: ${ethChainPrice}</p>
              )}
            </div>

            <div className="p-4 border rounded-md">
              <button
                onClick={getpoygonChainPrice}
                disabled={loading}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  'Fetch Price of BTC/USD on Uniswap Polygon'
                )}
              </button>
              {poygonChainPrice && (
                <p className="mt-2 text-center">BTC/USD (Polygon) Price: ${poygonChainPrice}</p>
              )}
            </div>

            <div className="p-4 border rounded-md">
              <button
                onClick={getBothPrices}
                disabled={loading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  'Calculate Price Difference'
                )}
              </button>
              {priceDiff && (
                <p className="mt-2 text-center">Price Difference: SATS {priceDiff}</p>
              )}
            </div>

            <form onSubmit={verifyThreshold} className="p-4 border rounded-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Threshold
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !priceDiff}
                  className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
                  ) : (
                    'Verify with ZK Proof'
                  )}
                </button>
                {verificationState && (
                <p className="mt-2 text-center">Verification State: {verificationState}</p>
              )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;