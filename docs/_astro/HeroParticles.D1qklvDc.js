import{j as o}from"./jsx-runtime.D_zvdyIk.js";import{r as t}from"./index.DeO6U63H.js";import{C,u as w,a as m,b}from"./react-three-fiber.esm.Ch0IK_KS.js";import"./index.Bb8JjhAW.js";const c=100,p=50,v=50;function M(){const x=t.useRef(null),u=t.useRef(null),a=t.useRef({x:0,y:0}),{camera:r}=w(),n=p*v,{positions:h,originalIndices:g}=t.useMemo(()=>{const e=new Float32Array(n*3),d=new Float32Array(n*2);let i=0;for(let s=0;s<p;s++)for(let l=0;l<v;l++)e[i*3]=s*c-p*c/2,e[i*3+1]=0,e[i*3+2]=l*c-v*c/2,d[i*2]=s,d[i*2+1]=l,i++;return{positions:e,originalIndices:d}},[n]),f=t.useCallback(e=>{a.current.x=e.clientX-window.innerWidth/2,a.current.y=e.clientY-window.innerHeight/2},[]);t.useEffect(()=>(window.addEventListener("pointermove",f,{passive:!0}),()=>{window.removeEventListener("pointermove",f)}),[f]);const y=t.useMemo(()=>({uTime:{value:0},uColorLow:{value:new m("#0f172a")},uColorMid:{value:new m("#2563eb")},uColorHigh:{value:new m("#7dd3fc")}}),[]);return b(e=>{!x.current||!u.current||(r.position.x+=(a.current.x*.5-r.position.x)*.05,r.position.y+=(-a.current.y*.5+350-r.position.y)*.05,r.lookAt(0,0,0),u.current.uniforms.uTime.value=e.clock.getElapsedTime())}),o.jsxs("points",{ref:x,children:[o.jsxs("bufferGeometry",{children:[o.jsx("bufferAttribute",{attach:"attributes-position",count:n,array:h,itemSize:3}),o.jsx("bufferAttribute",{attach:"attributes-aIndex",count:n,array:g,itemSize:2})]}),o.jsx("shaderMaterial",{ref:u,uniforms:y,vertexShader:`
    uniform float uTime;
    attribute vec2 aIndex;
    varying float vY;
    
    void main() {
      float ix = aIndex.x;
      float iy = aIndex.y;
      float count = uTime * 1.5; // Adjusted speed scale
      
      // Calculate Wave Y in shader
      float y = sin((ix + count) * 0.3) * 50.0 + sin((iy + count) * 0.5) * 50.0;
      vY = y;
      
      // Calculate Scale in shader
      float scale = (sin((ix + count) * 0.3) + 1.0) * 20.0 + (sin((iy + count) * 0.5) + 1.0) * 20.0;
      
      vec3 pos = position;
      pos.y = y;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = scale * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,fragmentShader:`
    uniform vec3 uColorLow;
    uniform vec3 uColorMid;
    uniform vec3 uColorHigh;
    varying float vY;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.475) discard;
      
      // Map Y position (-100 to 100) to color in fragment shader
      float t = (vY + 100.0) / 200.0;
      float clamped = clamp(t, 0.0, 1.0);
      
      vec3 vColor;
      if (clamped < 0.5) {
        vColor = mix(uColorLow, uColorMid, clamped * 2.0);
      } else {
        vColor = mix(uColorMid, uColorHigh, (clamped - 0.5) * 2.0);
      }
      
      // Glass effect: brighter edge ring, softer center
      float ring = smoothstep(0.35, 0.475, dist) * 0.6;
      float fill = smoothstep(0.475, 0.0, dist) * 0.45;
      float alpha = fill + ring;
      vec3 col = vColor + ring * 0.4;
      gl_FragColor = vec4(col, alpha);
    }
  `,transparent:!0,depthWrite:!1})]})}function R(){return o.jsx("div",{style:{position:"absolute",inset:0,zIndex:0},children:o.jsx(C,{camera:{position:[0,350,1e3],fov:75,near:5,far:1e4},dpr:[1,2],gl:{antialias:!0,alpha:!0,powerPreference:"high-performance"},style:{background:"transparent"},children:o.jsx(M,{})})})}export{R as default};
