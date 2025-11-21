import { ReactNode } from 'react';

type CardProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
};

export function Card({
    title,
    description,
    actions,
    children,
    className = '',
    noPadding = false,
}: CardProps) {
    return (
        <div className={`ms-card ${className}`}>
            {(title || description || actions) && (
                <div className="ms-card__header">
                    <div className="ms-card__header-content">
                        {title && <h3 className="ms-card__title">{title}</h3>}
                        {description && <p className="ms-card__description">{description}</p>}
                    </div>
                    {actions && <div className="ms-card__actions">{actions}</div>}
                </div>
            )}
            <div className={`ms-card__content ${noPadding ? 'ms-card__content--no-padding' : ''}`}>
                {children}
            </div>
        </div>
    );
}
