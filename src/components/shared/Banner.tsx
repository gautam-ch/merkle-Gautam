interface BannerProps {
  tone: 'warning' | 'info';
  message: string;
  onDismiss: () => void;
}

const TONES = {
  warning: { bar: 'bg-amber-50 border-amber-200 text-amber-800', close: 'text-amber-600 hover:text-amber-900' },
  info: { bar: 'bg-blue-50 border-blue-200 text-blue-800', close: 'text-blue-600 hover:text-blue-900' },
};

/** A thin message bar under the header, with a close button. */
export const Banner: React.FC<BannerProps> = ({ tone, message, onDismiss }) => (
  <div
    role="alert"
    className={`flex items-center justify-between border-b px-6 py-2 text-xs font-medium ${TONES[tone].bar}`}
  >
    <span>{message}</span>
    <button onClick={onDismiss} title="Dismiss" className={`font-bold ${TONES[tone].close}`}>
      &times;
    </button>
  </div>
);
