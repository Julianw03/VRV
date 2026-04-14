const DEFAULT_SSL_PORT = '443';

const protocolToUrlMap = new Map();

const log = (...data: unknown[]) => {
    console.log('[Local-Link-Resolver]', ...data);
};

const registerProtocol = (protocol: string, devPort?: number) => {
    const val = createBackendUrl(protocol, devPort);
    log('Register', protocol, '->', val);
    protocolToUrlMap.set(protocol, val);
    return val;
};

const getBackendUrl = (protocol: string) => {
    const val = protocolToUrlMap.get(protocol);
    if (val) {
        return val;
    }
    log('Get called for unregistered protocol, will register', protocol);
    return registerProtocol(protocol);
};


const createBackendUrl = (protocol: string, devPort?: number) => {
    const { hostname, port: winPort } = window.location
    const isDev = import.meta.env.DEV;
    const port = devPort && isDev ? devPort : winPort;
    if (!port) {
        return `${protocol}://${hostname}${port ? `:${port}` : ''}`;
    }
    const backendUrl = `${protocol}://127.0.0.1`;
    if (DEFAULT_SSL_PORT === port && protocol.endsWith('s')) {
        return backendUrl;
    }

    return `${backendUrl}:${port}`;
};

export const resolve = (localLink: string, protocol: string = 'https') => {
    return `${getBackendUrl(protocol)}${localLink}`;
};

registerProtocol('http', 3000);
registerProtocol('ws', 3000);