import { useTranslation } from 'react-i18next';

type ConfirmModalProps = {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    confirmText?: string;
    cancelText?: string;
};

export function ConfirmationProvider({
    message,
    onConfirm,
    onCancel,
    title,
    confirmText,
    cancelText
}: ConfirmModalProps) {
    const { t } = useTranslation();

    return (
        <div className="confirm-overlay">
            <div className="confirm-box">
                <h3>{title || t('confirmation.title', 'Potwierdzenie')}</h3>
                <p>{message}</p>

                <div className="confirm-actions">
                    <button className="secondary-button" onClick={onCancel}>
                        {cancelText || t('confirmation.btn_cancel', 'Anuluj')}
                    </button>

                    <button className="mint-button" onClick={onConfirm}>
                        {confirmText || t('confirmation.btn_confirm', 'Tak')}
                    </button>
                </div>
            </div>
        </div>
    );
}