export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(millis: number): string {
    return new Date(millis).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatDuration(millis: number): string {
    const totalSeconds = Math.floor(millis / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export function truncateId(id: string): string {
    return id.length > 14 ? `${id.slice(0, 14)}…` : id
}

export function mapDisplayName(mapId: string): string {
    const parts = mapId.split('/')
    return parts[parts.length - 1] || mapId
}
