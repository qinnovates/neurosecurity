import{j as s,C as F,u as U,a as m,b as T}from"./react-three-fiber.esm.DwvWyGdR.js";import{r}from"./index.ClAeb1qX.js";const v=100,h=50,x=50;function _(){const y=r.useRef(null),f=r.useRef({x:0,y:0}),M=r.useRef(0),{camera:c}=U(),i=h*x,{positions:C,scales:j,colors:P}=r.useMemo(()=>{const e=new Float32Array(i*3),u=new Float32Array(i),a=new Float32Array(i*3);let t=0;for(let n=0;n<h;n++)for(let o=0;o<x;o++)e[t*3]=n*v-h*v/2,e[t*3+1]=0,e[t*3+2]=o*v-x*v/2,u[t]=1,a[t*3]=.23,a[t*3+1]=.51,a[t*3+2]=.96,t++;return{positions:e,scales:u,colors:a}},[i]),S=r.useMemo(()=>new m("#0f172a"),[]),w=r.useMemo(()=>new m("#2563eb"),[]),R=r.useMemo(()=>new m("#7dd3fc"),[]),l=r.useMemo(()=>new m,[]),b=r.useCallback(e=>{f.current.x=e.clientX-window.innerWidth/2,f.current.y=e.clientY-window.innerHeight/2},[]);return r.useEffect(()=>(window.addEventListener("pointermove",b,{passive:!0}),()=>{window.removeEventListener("pointermove",b)}),[b]),T(()=>{if(!y.current)return;c.position.x+=(f.current.x*.5-c.position.x)*.05,c.position.y+=(-f.current.y*.5+350-c.position.y)*.05,c.lookAt(0,0,0);const e=y.current.geometry,u=e.attributes.position,a=e.attributes.scale,t=e.attributes.color,n=M.current;let o=0;for(let d=0;d<h;d++)for(let p=0;p<x;p++){const A=Math.sin((d+n)*.3)*50+Math.sin((p+n)*.5)*50,z=(Math.sin((d+n)*.3)+1)*20+(Math.sin((p+n)*.5)+1)*20;u.array[o*3+1]=A,a.array[o]=z;const E=(A+100)/200,g=Math.max(0,Math.min(1,E));g<.5?l.lerpColors(S,w,g*2):l.lerpColors(w,R,(g-.5)*2),t.array[o*3]=l.r,t.array[o*3+1]=l.g,t.array[o*3+2]=l.b,o++}u.needsUpdate=!0,a.needsUpdate=!0,t.needsUpdate=!0,M.current+=.04}),s.jsxs("points",{ref:y,children:[s.jsxs("bufferGeometry",{children:[s.jsx("bufferAttribute",{attach:"attributes-position",count:i,array:C,itemSize:3}),s.jsx("bufferAttribute",{attach:"attributes-scale",count:i,array:j,itemSize:1}),s.jsx("bufferAttribute",{attach:"attributes-color",count:i,array:P,itemSize:3})]}),s.jsx("shaderMaterial",{vertexShader:`
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
  `,transparent:!0,depthWrite:!1})]})}function O(){return s.jsx("div",{style:{position:"absolute",inset:0,zIndex:0},children:s.jsx(F,{camera:{position:[0,350,1e3],fov:75,near:5,far:1e4},dpr:[1,2],gl:{antialias:!0,alpha:!0},style:{background:"transparent"},children:s.jsx(_,{})})})}export{O as default};
