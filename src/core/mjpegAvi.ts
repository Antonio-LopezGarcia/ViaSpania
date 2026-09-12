// RIFF/AVI 1.0: https://learn.microsoft.com/en-us/windows/win32/directshow/avi-riff-file-reference
// Every JPEG is a keyframe. Playback timing depends on fps, never on rendering time.
const text=(value:string)=>new TextEncoder().encode(value);
const join=(parts:Uint8Array[])=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out};
function numbers(values:number[]){const bytes=new Uint8Array(values.length*4),view=new DataView(bytes.buffer);values.forEach((value,i)=>view.setUint32(i*4,value,true));return bytes}
function chunk(id:string,data:Uint8Array){return join([text(id),numbers([data.length]),data,...(data.length%2?[new Uint8Array(1)]:[])])}
function list(id:string,parts:Uint8Array[]){return chunk('LIST',join([text(id),...parts]))}
export class MjpegAviStream {
 private sizes:number[]=[];
 private size=0;
 constructor(readonly width:number,readonly height:number,readonly fps=30,readonly byteLimit=1_499_000_000){
  if(![width,height,fps].every(n=>Number.isInteger(n)&&n>0)||width>32767||height>32767)throw new Error('Dimensiones o frecuencia de vídeo no válidas.');
 }
 addFrame(jpeg:Uint8Array){
  if(jpeg[0]!==255||jpeg[1]!==216)throw new Error('El motor web no produjo un fotograma JPEG válido.');
  if(this.size+jpeg.length+24>this.byteLimit)throw new Error('El vídeo supera el límite de 1,5 GB. Reduzca duración o resolución.');
  this.sizes.push(jpeg.length);this.size+=jpeg.length+24;return chunk('00dc',jpeg);
 }
 finish(){
  if(!this.sizes.length)throw new Error('No hay fotogramas para crear el vídeo.');
  const count=this.sizes.length,max=Math.max(...this.sizes);
  const avih=chunk('avih',numbers([Math.round(1e6/this.fps),max*this.fps,0,0x10,count,0,1,max,this.width,this.height,0,0,0,0]));
  const strh=join([text('vidsMJPG'),numbers([0,0,0,1,this.fps,0,count,max,0xffffffff,0]),new Uint8Array(8)]);
  const rect=new DataView(strh.buffer);rect.setInt16(52,this.width,true);rect.setInt16(54,this.height,true);
  const strf=numbers([40,this.width,this.height,0x00180001,0,this.width*this.height*3,0,0,0,0]);strf.set(text('MJPG'),16);
  const header=list('hdrl',[avih,list('strl',[chunk('strh',strh),chunk('strf',strf)])]);
  let offset=4;const index:Uint8Array[]=[];
  this.sizes.forEach(size=>{index.push(join([text('00dc'),numbers([0x10,offset,size])]));offset+=8+size+(size%2)});
  const footer=chunk('idx1',join(index)),prefix=join([text('RIFF'),numbers([4+header.length+8+offset+footer.length]),text('AVI '),header,text('LIST'),numbers([offset]),text('movi')]);
  this.dispose();return{header:prefix,index:footer};

 }
 dispose(){this.sizes=[];this.size=0}
}

/** Small in-memory adapter for fixtures; production export uses MjpegAviStream. */
export class MjpegAviEncoder {
 private stream:MjpegAviStream;
 private chunks:Uint8Array[]=[];
 constructor(width:number,height:number,fps=30,byteLimit=95_000_000){this.stream=new MjpegAviStream(width,height,fps,byteLimit)}
 addFrame(jpeg:Uint8Array){this.chunks.push(this.stream.addFrame(jpeg))}
 finish(){const {header,index}=this.stream.finish();const result=join([header,...this.chunks,index]);this.dispose();return result}
 dispose(){this.stream.dispose();this.chunks=[]}
}
