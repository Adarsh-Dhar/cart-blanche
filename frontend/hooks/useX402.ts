import { useState, useCallback } from 'react';
import { createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';

export function useX402() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      throw new Error("MetaMask is not installed.");
    }
    const client = createWalletClient({
      chain: sepolia, // Make sure this matches the chainId in your mandate
      transport: custom(window.ethereum)
    });
    const [account] = await client.requestAddresses();
    setAddress(account);
    return { client, account };
  }, []);

  const signMandate = useCallback(async (payload: any) => {
    let currentAddress = address;
    let currentClient;
    // Connect if not already connected
    if (!currentAddress) {
      const connection = await connect();
      currentAddress = connection.account;
      currentClient = connection.client;
    } else {
      currentClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum)
      });
    }

    // 🚨 FIX: Deep copy the domain and delete verifyingContract to prevent the internal RPC error
    const sanitizedDomain = { ...payload.domain };
    if (sanitizedDomain.verifyingContract) {
      delete sanitizedDomain.verifyingContract;
    }

    const typedData = {
      domain: sanitizedDomain, // Use the sanitized domain here
      types: payload.types,
      primaryType: 'CartMandate',
      message: payload.message,
    };

    console.log("Requesting signature for:", typedData);

    // 🚨 Trigger MetaMask popup
    const signature = await currentClient.signTypedData({
      account: currentAddress,
      ...typedData
    });

    console.log("Signature received:", signature);
    return signature;
  }, [address, connect]);

  return { connect, signMandate, address };
}
