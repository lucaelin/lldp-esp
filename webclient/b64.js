export function b64encode(arraybuffer) {
    let binary = '';
    const bytes = new Uint8Array( arraybuffer );
    const len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

export function b64decode(b64string) {
    const binary_string = window.atob(b64string || '');
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
