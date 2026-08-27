export type NotificationSound='soft'|'chime'|'double'|'bright';

export const NOTIFICATION_SOUNDS:Record<NotificationSound,string>={
  soft:'Suave',
  chime:'Campanilla',
  double:'Doble tono',
  bright:'Brillante',
};

export const NOTIFICATION_PATTERNS:Record<NotificationSound,readonly {frequency:number;delay:number;duration:number;gain:number}[]>={
  soft:[{frequency:523.25,delay:0,duration:.18,gain:.12}],
  chime:[{frequency:659.25,delay:0,duration:.16,gain:.13},{frequency:783.99,delay:.11,duration:.3,gain:.1}],
  double:[{frequency:523.25,delay:0,duration:.13,gain:.12},{frequency:659.25,delay:.18,duration:.18,gain:.12}],
  bright:[{frequency:659.25,delay:0,duration:.1,gain:.1},{frequency:783.99,delay:.09,duration:.1,gain:.1},{frequency:1046.5,delay:.18,duration:.28,gain:.09}],
};

export function playNotificationSound(sound:NotificationSound){
  if(typeof window==='undefined')return;
  const AudioContextClass=window.AudioContext;
  if(!AudioContextClass)return;
  try{
    const context=new AudioContextClass(),start=context.currentTime+.02,pattern=NOTIFICATION_PATTERNS[sound]??NOTIFICATION_PATTERNS.chime;
    for(const note of pattern){
      const oscillator=context.createOscillator(),gain=context.createGain(),begin=start+note.delay,end=begin+note.duration;
      oscillator.type='sine';oscillator.frequency.setValueAtTime(note.frequency,begin);
      gain.gain.setValueAtTime(.0001,begin);gain.gain.exponentialRampToValueAtTime(note.gain,begin+.015);gain.gain.exponentialRampToValueAtTime(.0001,end);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(begin);oscillator.stop(end+.02);
    }
    const finish=Math.max(...pattern.map(note=>note.delay+note.duration));
    window.setTimeout(()=>void context.close(),(finish+.15)*1000);
  }catch{/* El aviso sonoro nunca debe interrumpir una operación completada. */}
}
