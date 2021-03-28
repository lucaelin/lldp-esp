export const dvSlice = (dv, begin=0, end=undefined) => {
  if (end === undefined) end = dv.byteLength;
  return new DataView(dv.buffer.slice(begin, end))
}

export const getMac = (packet) => {
  return [0,1,2,3,4,5].map((v)=>('00'+packet.getUint8(v).toString(16)).slice(-2)).join(':')
}
export const getHex = (packet) => {
  return new Array(packet.byteLength).fill(0).map((v,i)=>('00'+packet.getUint8(i).toString(16)).slice(-2)).join('-');
}
export const getString = (packet) => {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(packet);
}
export const getIPv4 = (packet) => {
  return [0,1,2,3].map((v)=>packet.getUint8(v).toString()).join('.')
}
export const getIPv6 = (packet) => {
  return Array(8).fill(0).map((v, i)=>packet.getUint16(i*2).toString(16)).join(':')
}
