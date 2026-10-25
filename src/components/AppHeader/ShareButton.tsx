import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

const CONFIRMATION_MS = 2000;

/** Copies the current address, which holds the whole view (filters, sort, pin, selection). */
export const ShareButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), CONFIRMATION_MS);
    });
  };

  return (
    <button
      onClick={copyLink}
      title="Copy a link to this exact view"
      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? 'Link Copied' : 'Share'}
    </button>
  );
};
