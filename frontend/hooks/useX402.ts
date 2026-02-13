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


    // Dynamically determine the correct primaryType from types
    let primaryType = 'CartMandate';
    if (payload.types && typeof payload.types === 'object') {
      const typeKeys = Object.keys(payload.types).filter(k => k !== 'EIP712Domain');
      if (typeKeys.length > 0) {
        primaryType = typeKeys[0];
      }
    }

    const typedData = {
      domain: sanitizedDomain, // Use the sanitized domain here
      types: payload.types,
      primaryType,
      message: payload.message,
    };


    // Defensive: Deep check for required EIP-712 fields before signing
    if (!typedData.domain || typeof typedData.domain !== 'object') {
      throw new Error('EIP-712 payload is missing required field: domain.');
    }
    if (!typedData.types || typeof typedData.types !== 'object') {
      throw new Error('EIP-712 payload is missing required field: types.');
    }
    if (!typedData.message || typeof typedData.message !== 'object') {
      throw new Error('EIP-712 payload is missing required field: message.');
    }
    if (!typedData.primaryType || typeof typedData.primaryType !== 'string') {
      throw new Error('EIP-712 payload is missing required field: primaryType.');
    }
    if (!typedData.types[typedData.primaryType] || !Array.isArray(typedData.types[typedData.primaryType])) {
      throw new Error(`EIP-712 types is missing definition for primaryType '${typedData.primaryType}'.`);
    }
    // Final check: ensure all fields in types[primaryType] are valid
    for (const field of typedData.types[typedData.primaryType]) {
      if (!field || typeof field !== 'object' || typeof field.name !== 'string' || typeof field.type !== 'string') {
        throw new Error(`EIP-712 types[${typedData.primaryType}] contains an invalid field definition: ${JSON.stringify(field)}`);
      }
    }

    console.log("Requesting signature for:", typedData);

    // 🚨 Trigger MetaMask popup

    // Final runtime check for all required fields before MetaMask call
    if (!currentClient) {
      throw new Error('Wallet client is not initialized.');
    }
    if (!currentAddress) {
      throw new Error('Wallet address is not initialized.');
    }
    if (!typedData.domain || !typedData.types || !typedData.primaryType || !typedData.message) {
      throw new Error('Typed data is missing required fields.');
    }

    let signature;
    try {
      signature = await currentClient.signTypedData({
        account: currentAddress,
        ...typedData
      });
    } catch (err) {
      console.error('MetaMask signTypedData error:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        throw new Error('MetaMask signTypedData failed: ' + (err as any).message);
      }
      throw err;
    }

    console.log("Signature received:", signature);
    return signature;
  }, [address, connect]);

  return { connect, signMandate, address };
}
