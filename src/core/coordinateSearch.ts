/** Input: WGS84 decimal degrees, latitude first. Returns [longitude, latitude] for map APIs; null for place names. */
export function parseSearchCoordinates(input:string):[number,number]|null{
 const text=input.trim();
 const numeric=/^[+\-\d.,;\s]+$/.test(text)||/^[+\-]?\d[^a-z]*[,;]/i.test(text);
 if(!numeric)return null;
 const match=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
 if(!match)throw new Error('Formato de coordenadas inválido. Use latitud, longitud en grados decimales, con punto decimal. Ejemplo: 40.4168, -3.7038.');
 const latitude=Number(match[1]),longitude=Number(match[2]);
 if(!Number.isFinite(longitude)||!Number.isFinite(latitude)||Math.abs(longitude)>180||Math.abs(latitude)>90)throw new Error('Coordenadas fuera de rango: longitud entre -180 y 180; latitud entre -90 y 90.');
 return [longitude,latitude];
}
