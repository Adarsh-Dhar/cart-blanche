import React from 'react';

interface TransactionReceiptProps {
  receipt: {
    tx_hash: string;
    [key: string]: any;
  };
}

const SKALE_EXPLORER_URL = 'https://elated-tan-skat.explorer.mainnet.skalenodes.com/tx/';

export function TransactionReceipt({ receipt }: TransactionReceiptProps) {
  if (!receipt?.tx_hash) return null;
  return (
    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 my-3">
      <div className="font-semibold text-green-700 dark:text-green-300 mb-1">Payment Complete!</div>
      <div className="text-xs text-gray-700 dark:text-gray-200 mb-2">Your transaction has been securely settled on the SKALE network.</div>
      <a
        href={`${SKALE_EXPLORER_URL}${receipt.tx_hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-200 font-medium text-xs rounded-lg transition-colors hover:bg-green-200 dark:hover:bg-green-700"
      >
        View on SKALE Explorer
      </a>
      <div className="mt-2 text-xs text-gray-500 break-all">Tx Hash: {receipt.tx_hash}</div>
    </div>
  );
}
