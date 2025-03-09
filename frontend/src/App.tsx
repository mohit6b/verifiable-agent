import React, { useState } from 'react';
import { ethers } from 'ethers';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as snarkjs from 'snarkjs';
import circuitWasm from './diff.wasm?url';
import provingKey from './diff_0001.zkey?url';
import verifyKey from './verification_key.json'
import ethChainOracleABI from './abis/ethOracleAbi.json';
import polygonChainOracleABI from './abis/polygonOracleAbi.json';
import usdcCoinABI from './abis/usdcCoinAbi.json'
import emailjs from 'emailjs-com';

// Contract addresses
const ETH_CHAIN_ORACLE_ADDRESS = import.meta.env.VITE_ETH_CHAIN_ORACLE_ADDRESS!;
const POLYGON_CHAIN_ORACLE_ADDRESS = import.meta.env.VITE_POLYGON_CHAIN_ORACLE_ADDRESS!;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS!;
const SIGNER = import.meta.env.VITE_PRIVATE_KEY!;

function App() {
  const [ethChainPrice, setethChainPrice] = useState<string>('');
  const [poygonChainPrice, setpolygonChainPrice] = useState<string>('');
  const [priceDiff, setPriceDiff] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [threshold, setThreshold] = useState<string>('');
  const [verificationState, setVerificationState] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const getBothPrices = async () => {
    const eth_provider = new ethers.JsonRpcProvider(import.meta.env.VITE_SEP_INFURA_API);
    const eth_contract = new ethers.Contract(ETH_CHAIN_ORACLE_ADDRESS, ethChainOracleABI, eth_provider);
    const ethChainPrice = await eth_contract.getChainlinkDataFeedLatestAnswer();
    setethChainPrice(ethers.formatUnits(ethChainPrice, 8));

    const polygon_provider = new ethers.JsonRpcProvider(import.meta.env.VITE_AMOY_INFURA_API);
    const polygon_contract = new ethers.Contract(POLYGON_CHAIN_ORACLE_ADDRESS, polygonChainOracleABI, polygon_provider);
    const poygonChainPrice = await polygon_contract.getChainlinkDataFeedLatestAnswer();
    setpolygonChainPrice(ethers.formatUnits(poygonChainPrice, 8));

    const diff = Math.abs(parseFloat(ethChainPrice) - parseFloat(poygonChainPrice));
    setPriceDiff(ethers.formatUnits(diff, 8));
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

      const verified = await snarkjs.groth16.verify(verifyKey, publicSignals, proof);

      const calldataString = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

      console.log("calldataString : ", calldataString);
      console.log("Verification: ", verified);

      if (publicSignals[0] === "1") {
        setVerificationState('Proof verified successfully!');
        console.log("Trying sent successfully!");

        const eth_provider = new ethers.JsonRpcProvider(import.meta.env.VITE_SEP_INFURA_API);
        const wallet = new ethers.Wallet(SIGNER, eth_provider);
        const usdc_contract = new ethers.Contract(USDC_ADDRESS, usdcCoinABI, wallet);

        try {
          const tx = await usdc_contract.transfer(userAddress, ethers.parseUnits("1", 6));
          setTxHash(tx.hash);
          setTxUrl(`https://sepolia.etherscan.io/tx/${tx.hash}`);
          console.log("Transaction URL: ", txUrl);
          console.log("Transaction Hash: ", txHash);
        } catch (error) {
          console.error("Transaction failed", error);
        }

        // ✅ Send email notification
        const emailParams = {
          reply_to: String(email).trim(), 
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

      } else {
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
          <h1 className="text-2xl font-bold text-center mb-6">Arbitrage Finder Verifiable Agent</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-6">

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
              {ethChainPrice && (
                <p className="mt-2 text-center">BTC/USD(ETH) Price: ${ethChainPrice}</p>
              )}
              {poygonChainPrice && (
                <p className="mt-2 text-center">BTC/USD (Polygon) Price: ${poygonChainPrice}</p>
              )}
              {priceDiff && (
                <p className="mt-2 text-center">Price Difference: ${priceDiff}</p>
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
                    User Address
                  </label>
                  <input
                    type="string"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
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