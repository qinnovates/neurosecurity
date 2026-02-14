import{j as c,C as ee,u as te,a as s,b as re}from"./react-three-fiber.esm.DwvWyGdR.js";import{r as e}from"./index.ClAeb1qX.js";const v=100,x=50,w=50,oe=600,ne=.97,se=5;function ie(){const E=e.useRef(null),b=e.useRef({x:0,y:0}),y=e.useRef({x:0,z:0}),S=e.useRef(!1),U=e.useRef(0),W=e.useRef([]),j=e.useRef(0),{camera:g}=te(),p=x*w,{positions:G,scales:q,colors:V}=e.useMemo(()=>{const n=new Float32Array(p*3),l=new Float32Array(p),r=new Float32Array(p*3);let o=0;for(let u=0;u<x;u++)for(let h=0;h<w;h++)n[o*3]=u*v-x*v/2,n[o*3+1]=0,n[o*3+2]=h*v-w*v/2,l[o]=1,r[o*3]=.23,r[o*3+1]=.51,r[o*3+2]=.96,o++;return{positions:n,scales:l,colors:r}},[p]),B=e.useMemo(()=>new s("#0f172a"),[]),k=e.useMemo(()=>new s("#2563eb"),[]),J=e.useMemo(()=>new s("#7dd3fc"),[]),M=e.useMemo(()=>[new s("#06b6d4"),new s("#8b5cf6"),new s("#ef4444"),new s("#f59e0b"),new s("#06b6d4")],[]),d=e.useMemo(()=>new s,[]),X=e.useMemo(()=>new s,[]),L=e.useCallback(n=>{b.current.x=n.clientX-window.innerWidth/2,b.current.y=n.clientY-window.innerHeight/2;const l=(n.clientX/window.innerWidth-.5)*x*v,r=(n.clientY/window.innerHeight-.5)*w*v;y.current.x=l,y.current.z=r,S.current=!0},[]),_=e.useCallback(()=>{S.current=!1},[]);return e.useEffect(()=>(window.addEventListener("pointermove",L,{passive:!0}),window.addEventListener("pointerleave",_,{passive:!0}),()=>{window.removeEventListener("pointermove",L),window.removeEventListener("pointerleave",_)}),[L,_]),re((n,l)=>{if(!E.current)return;if(g.position.x+=(b.current.x*.5-g.position.x)*.05,g.position.y+=(-b.current.y*.5+350-g.position.y)*.05,g.lookAt(0,0,0),S.current&&(j.current+=l,j.current>.3)){j.current=0;const t=W.current;t.length>=se&&t.shift(),t.push({cx:y.current.x,cz:y.current.z,radius:0,strength:1,time:0})}const r=W.current;for(let t=r.length-1;t>=0;t--){const i=r[t];i.radius+=oe*l,i.strength*=ne,i.time+=l,i.strength<.01&&r.splice(t,1)}const o=E.current.geometry,u=o.attributes.position,h=o.attributes.scale,P=o.attributes.color,R=U.current;let f=0;for(let t=0;t<x;t++)for(let i=0;i<w;i++){const K=u.array[f*3],Q=u.array[f*3+2];let T=Math.sin((t+R)*.3)*50+Math.sin((i+R)*.5)*50,Y=(Math.sin((t+R)*.3)+1)*20+(Math.sin((i+R)*.5)+1)*20,C=0,D=0;for(let A=0;A<r.length;A++){const a=r[A],m=K-a.cx,z=Q-a.cz,F=Math.sqrt(m*m+z*z),N=Math.abs(F-a.radius),O=300;if(N<O){const H=(1-N/O)*a.strength,$=Math.sin(F*.02-a.time*8)*H;T+=$*80,Y+=H*30,C=Math.max(C,H),D=a.time*2+F*.01}}u.array[f*3+1]=T,h.array[f]=Y;const Z=(T+100)/200,I=Math.max(0,Math.min(1,Z));if(I<.5?d.lerpColors(B,k,I*2):d.lerpColors(k,J,(I-.5)*2),C>.01){const a=(D*.5%1+1)%1*(M.length-1),m=Math.floor(a),z=a-m;X.lerpColors(M[m],M[Math.min(m+1,M.length-1)],z),d.lerp(X,C*.7)}P.array[f*3]=d.r,P.array[f*3+1]=d.g,P.array[f*3+2]=d.b,f++}u.needsUpdate=!0,h.needsUpdate=!0,P.needsUpdate=!0,U.current+=.04}),c.jsxs("points",{ref:E,children:[c.jsxs("bufferGeometry",{children:[c.jsx("bufferAttribute",{attach:"attributes-position",count:p,array:G,itemSize:3}),c.jsx("bufferAttribute",{attach:"attributes-scale",count:p,array:q,itemSize:1}),c.jsx("bufferAttribute",{attach:"attributes-color",count:p,array:V,itemSize:3})]}),c.jsx("shaderMaterial",{vertexShader:`
    attribute float scale;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = scale * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,fragmentShader:`
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.475) discard;
      // Glass effect: brighter edge ring, softer center
      float ring = smoothstep(0.35, 0.475, dist) * 0.6;
      float fill = smoothstep(0.475, 0.0, dist) * 0.45;
      float alpha = fill + ring;
      vec3 col = vColor + ring * 0.4;
      gl_FragColor = vec4(col, alpha);
    }
  `,transparent:!0,depthWrite:!1})]})}function fe(){return c.jsx("div",{style:{position:"absolute",inset:0,zIndex:0},children:c.jsx(ee,{camera:{position:[0,350,1e3],fov:75,near:5,far:1e4},dpr:[1,2],gl:{antialias:!0,alpha:!0},style:{background:"transparent"},children:c.jsx(ie,{})})})}export{fe as default};
