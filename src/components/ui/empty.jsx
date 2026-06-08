export function Empty({ children, className = "" }) {
    return (
        <div className={`flex flex-col items-center justify-center text-center ${className}`}>
            {children}
        </div>
    );
}

export function EmptyHeader({ children }) {
    return <div className="flex flex-col items-center gap-2">{children}</div>;
}

export function EmptyMedia({ children }) {
    return <div className="mb-2">{children}</div>;
}

export function EmptyTitle({ children }) {
    return <h3 className="text-xl font-semibold">{children}</h3>;
}

export function EmptyDescription({ children }) {
    return <p className="text-lg text-muted-foreground">{children}</p>;
}

export function EmptyContent({ children }) {
    return <div className="mt-4">{children}</div>;
}