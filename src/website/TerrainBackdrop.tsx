import {useEffect, useRef} from 'react';
import * as THREE from 'three';

const terrainHeight=(x:number,z:number)=>{
  const ridge=8*Math.exp(-Math.pow((x+Math.sin(z*.13)*5)/14,2));
  const detail=Math.sin(x*.46+z*.1)*1.1+Math.cos(z*.29-x*.12)*.85+Math.sin((x+z)*.72)*.25;
  return (ridge+detail)*(0.35+Math.max(0,(z+39)/78));
};

export function TerrainBackdrop(){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x08100d,.027);
    const camera=new THREE.PerspectiveCamera(46,1,.1,160);camera.position.set(0,12,25);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));element.appendChild(renderer.domElement);
    const geometry=new THREE.PlaneGeometry(62,78,74,92);geometry.rotateX(-Math.PI/2);
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,terrainHeight(x,z));}
    geometry.computeVertexNormals();
    const mountain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x263f34,roughness:.92,metalness:0,flatShading:true}));mountain.position.z=-13;scene.add(mountain);
    const wire=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x9dbb75,wireframe:true,transparent:true,opacity:.14}));wire.position.copy(mountain.position);wire.position.y=.025;scene.add(wire);
    const routePoints=Array.from({length:220},(_,index)=>{const ratio=index/219,z=30-ratio*65,x=-10+ratio*22+Math.sin(ratio*Math.PI*4.2)*3.6+Math.sin(ratio*Math.PI*9)*.7;return new THREE.Vector3(x,terrainHeight(x,z)+.36,z-13)});
    const routeGeometry=new THREE.BufferGeometry().setFromPoints(routePoints);routeGeometry.setDrawRange(0,2);
    const routeGlow=new THREE.Line(routeGeometry,new THREE.LineBasicMaterial({color:0x07100d,transparent:true,opacity:.88}));routeGlow.scale.set(1.002,1.002,1.002);scene.add(routeGlow);
    const route=new THREE.Line(routeGeometry,new THREE.LineBasicMaterial({color:0xd8ff55,transparent:true,opacity:1}));scene.add(route);
    const markerGeometry=new THREE.SphereGeometry(.48,20,20),startMaterial=new THREE.MeshBasicMaterial({color:0x59d2ff}),endMaterial=new THREE.MeshBasicMaterial({color:0xff796f}),travellerMaterial=new THREE.MeshBasicMaterial({color:0xd8ff55});
    const startMarker=new THREE.Mesh(markerGeometry,startMaterial),endMarker=new THREE.Mesh(markerGeometry,endMaterial),traveller=new THREE.Mesh(new THREE.SphereGeometry(.32,16,16),travellerMaterial);
    startMarker.position.copy(routePoints[0]);endMarker.position.copy(routePoints.at(-1)!);traveller.position.copy(routePoints[0]);scene.add(startMarker,endMarker,traveller);
    const startRing=new THREE.Mesh(new THREE.RingGeometry(.7,.82,32),new THREE.MeshBasicMaterial({color:0x59d2ff,side:THREE.DoubleSide,transparent:true,opacity:.7}));startRing.rotation.x=-Math.PI/2;startRing.position.copy(routePoints[0]).add(new THREE.Vector3(0,.04,0));scene.add(startRing);
    const endRing=new THREE.Mesh(new THREE.RingGeometry(.7,.82,32),new THREE.MeshBasicMaterial({color:0xff796f,side:THREE.DoubleSide,transparent:true,opacity:.35}));endRing.rotation.x=-Math.PI/2;endRing.position.copy(routePoints.at(-1)!).add(new THREE.Vector3(0,.04,0));scene.add(endRing);
    scene.add(new THREE.HemisphereLight(0xcfe9bd,0x07100d,1.7));const sun=new THREE.DirectionalLight(0xd8ff55,2.8);sun.position.set(-14,18,8);scene.add(sun);
    let frame=0,scroll=0;
    const resize=()=>{const {clientWidth:w,clientHeight:h}=element;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
    const onScroll=()=>{scroll=window.scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);const progress=Math.min(1,window.scrollY/Math.max(1,innerHeight*5.5)),visible=Math.max(2,Math.ceil(progress*routePoints.length));routeGeometry.setDrawRange(0,visible);traveller.position.copy(routePoints[visible-1]);endMaterial.opacity=.35+.65*progress;endMaterial.transparent=true};
    const animate=()=>{const now=performance.now(),t=now*.00008,pulse=1+Math.sin(now*.004)*.18;traveller.scale.setScalar(pulse);startRing.scale.setScalar(1+(Math.sin(now*.0025)+1)*.12);endRing.scale.setScalar(1+(Math.sin(now*.0025+2)+1)*.12);camera.position.x=Math.sin(t)*3+scroll*12-3;camera.position.y=12-scroll*5;camera.position.z=25-scroll*15;camera.lookAt(scroll*5-2,2,-15-scroll*9);renderer.render(scene,camera);frame=requestAnimationFrame(animate)};
    const observer=new ResizeObserver(resize);observer.observe(element);addEventListener('scroll',onScroll,{passive:true});resize();onScroll();animate();
    return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',onScroll);observer.disconnect();geometry.dispose();routeGeometry.dispose();markerGeometry.dispose();startRing.geometry.dispose();endRing.geometry.dispose();traveller.geometry.dispose();for(const material of [mountain.material,wire.material,route.material,routeGlow.material,startMaterial,endMaterial,travellerMaterial,startRing.material,endRing.material] as THREE.Material[])material.dispose();renderer.dispose();renderer.domElement.remove()};
  },[]);
  return <div className="terrain-backdrop" ref={host} aria-hidden="true"/>;
}
