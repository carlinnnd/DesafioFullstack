interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        ✓
      </span>
      <div>
        <strong>Lote cadastrado</strong>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Fechar notificação">
        ×
      </button>
    </div>
  );
}
