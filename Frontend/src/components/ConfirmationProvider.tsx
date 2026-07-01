type ConfirmModalProps = {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmationProvider({ message, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <div className="confirm-overlay">
            <div className="confirm-box">
                <h3>Potwierdzenie</h3>
                <p>{message}</p>

                <div className="confirm-actions">
                    <button className="secondary-button" onClick={onCancel}>
                        Anuluj
                    </button>

                    <button className="mint-button" onClick={onConfirm}>
                        Tak
                    </button>
                </div>
            </div>
        </div>
    );
}