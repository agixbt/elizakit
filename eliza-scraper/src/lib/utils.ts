export function formatUrl(url: string, options: {
    removeSubdomains?: boolean;
    separator?: string;
    preserveTopLevel?: boolean;
} = {}): string {
    const {
        removeSubdomains = false,
        separator = '-',
        preserveTopLevel = false
    } = options;

    try {
        const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
        const parts = cleanUrl.split('.');
        
        if (!preserveTopLevel) {
            parts.pop();
        }
        
        if (removeSubdomains && parts.length > 2) {
            return parts.slice(-2).join(separator);
        }
        
        return parts.join(separator);
    } catch (error) {
        console.error('Error formatting URL:', error);
        return url;
    }
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
