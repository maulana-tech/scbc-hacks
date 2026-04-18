interface Transaction {
  id: string;
  type: string;
  recipientAddress: string;
  amount: string;
  txHash: string | null;
  status: string;
  createdAt: string;
}

interface PaymentHistoryProps {
  transactions: Transaction[];
}

const TYPE_STYLE: Record<string, string> = {
  subscription: "bg-accent-subtle text-accent",
  tip: "bg-amber/15 text-amber",
  donation: "bg-violet/15 text-violet",
  conditional: "bg-blue/15 text-blue",
};

const STATUS_DOT: Record<string, string> = {
  completed: "bg-accent",
  failed: "bg-red",
  pending: "bg-amber",
};

export default function PaymentHistory({ transactions }: PaymentHistoryProps) {
  if (!transactions.length) {
    return (
      <div className="border border-border bg-surface rounded-xl p-10 text-center">
        <p className="type-body-sm text-text-3">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface rounded-xl overflow-hidden">
      <div className="grid grid-cols-[100px_1fr_100px_90px_80px] gap-2 px-5 py-3 border-b border-border">
        {["Type", "Recipient", "Amount", "Status", "Date"].map((h) => (
          <span key={h} className="type-caption text-text-3">{h}</span>
        ))}
      </div>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="grid grid-cols-[100px_1fr_100px_90px_80px] gap-2 px-5 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors items-center"
        >
          <span className={`px-2 py-0.5 text-[10px] rounded-md font-medium w-fit ${TYPE_STYLE[tx.type] || TYPE_STYLE.conditional}`}>
            {tx.type}
          </span>
          <span className="font-mono text-[12px] text-text-2 truncate">{tx.recipientAddress}</span>
          <span className="font-mono text-[13px] text-text">{tx.amount}</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[tx.status] || STATUS_DOT.pending}`} />
            <span className="text-[12px] text-text-2">{tx.status}</span>
          </span>
          <span className="text-[12px] text-text-3">{new Date(tx.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
