'use client'

import React from 'react';
import { ExternalLink, CheckCircle2 } from "lucide-react";

interface ReceiptItem {
  commodity: string;
  tx_hash: string;
  amount: number;
}

interface TransactionReceiptProps {
  receipt: {
    status?: string;
    receipts?: ReceiptItem[];
    tx_hash?: string;
    details?: string;
  };
}

const SKALE_EXPLORER_URL = '[https://elated-tan-skat.explorer.mainnet.skalenodes.com/tx/](https://elated-tan-skat.explorer.mainnet.skalenodes.com/tx/)';

export function TransactionReceipt({ receipt }: TransactionReceiptProps) {
  // Extract list (handles both your 9-merchant batch and single transactions)
  const txs = receipt.receipts || (receipt.tx_hash ? [{ 
    commodity: 'Item', 
    tx_hash: receipt.tx_hash, 
    amount: 0 
  }] : []);

  if (txs.length === 0) return null;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 my-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-green-500 rounded-full p-1">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-green-800 dark:text-green-300">
          {txs.length > 1 ? `Batch Settlement Complete` : `Payment Successful`}
        </h3>
      </div>
      
      <p className="text-sm text-green-700/80 dark:text-green-400/80 mb-4">
        {receipt.details || `Successfully processed ${txs.length} payments on SKALE.`}
      </p>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {txs.map((tx, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-green-100 dark:border-green-900/30">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{tx.commodity}</span>
              <span className="text-[10px] text-gray-500 font-mono truncate">{tx.tx_hash}</span>
            </div>
            <a
              href={`${SKALE_EXPLORER_URL}${tx.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-green-100 dark:hover:bg-green-800/50 rounded-lg text-green-700 dark:text-green-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}