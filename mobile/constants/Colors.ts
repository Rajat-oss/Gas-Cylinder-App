export const Colors = {
    primary: '#2563eb', // Professional blue
    secondary: '#64748b', // Slate gray
    accent: '#8b5cf6', // Violet for premium cards
    success: '#10b981', // Green for delivered
    warning: '#f59e0b', // Orange for out for delivery
    danger: '#ef4444', // Red for cancelled
    info: '#0ea5e9', // Sky blue
    background: '#f8fafc', // Light gray background
    surface: '#ffffff', // White cards
    text: '#0f172a', // Dark text
    textLight: '#475569', // Muted text
    border: '#e2e8f0', // Light borders
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const Typography = {
    h1: {
        fontSize: 28,
        fontWeight: 'bold' as const,
    },
    h2: {
        fontSize: 22,
        fontWeight: 'bold' as const,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 16,
        color: Colors.text,
    },
    caption: {
        fontSize: 14,
        color: Colors.textLight,
    },
};
