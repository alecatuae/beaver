(()=>{var e={};e.id=409,e.ids=[409],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2329:(e,t,n)=>{"use strict";n.r(t),n.d(t,{GlobalError:()=>i.a,__next_app__:()=>c,originalPathname:()=>p,pages:()=>l,routeModule:()=>f,tree:()=>u}),n(7352),n(5866),n(4968);var r=n(3191),o=n(8716),a=n(7922),i=n.n(a),s=n(5231),d={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>s[e]);n.d(t,d);let u=["",{children:["/_not-found",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(n.t.bind(n,5866,23)),"next/dist/client/components/not-found-error"]}]},{}]},{layout:[()=>Promise.resolve().then(n.bind(n,4968)),"/Users/alexandre/repos/beaver/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(n.t.bind(n,5866,23)),"next/dist/client/components/not-found-error"]}],l=[],p="/_not-found/page",c={require:n,loadChunk:()=>Promise.resolve()},f=new r.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/_not-found/page",pathname:"/_not-found",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:u}})},6189:(e,t,n)=>{Promise.resolve().then(n.t.bind(n,2994,23)),Promise.resolve().then(n.t.bind(n,6114,23)),Promise.resolve().then(n.t.bind(n,9727,23)),Promise.resolve().then(n.t.bind(n,9671,23)),Promise.resolve().then(n.t.bind(n,1868,23)),Promise.resolve().then(n.t.bind(n,4759,23))},9100:(e,t,n)=>{Promise.resolve().then(n.bind(n,8583))},8583:(e,t,n)=>{"use strict";n.d(t,{Providers:()=>d});var r=n(326);n(7577);var o=n(9592),a=n(9186),i=n(3574);function s({children:e,...t}){return r.jsx(i.f,{...t,children:e})}function d({children:e}){return r.jsx(s,{attribute:"class",defaultTheme:"light",enableSystem:!0,disableTransitionOnChange:!0,children:r.jsx(o.e,{client:a.Lp,children:e})})}},9186:(e,t,n)=>{"use strict";n.d(t,{CB:()=>m,D:()=>f,EI:()=>p,J0:()=>c,Lp:()=>l,WN:()=>r});var r,o=n(6874),a=n(3508),i=n(126),s=n(4293);let d="http://localhost:4000/graphql";console.log("Usando endpoint GraphQL:",d);let u=new o.u({uri:d,credentials:"same-origin"}),l=new a.f({link:u,cache:new i.h,defaultOptions:{watchQuery:{fetchPolicy:"network-only",nextFetchPolicy:"cache-first"}}}),p=(0,s.Ps)`
  query GetComponents($status: String) {
    components(status: $status) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`;(0,s.Ps)`
  query GetComponent($id: Int!) {
    component(id: $id) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`,(0,s.Ps)`
  query GetGraphData($depth: Int) {
    graphData(depth: $depth) {
      nodes {
        id
        name
        description
        type
        validFrom
        validTo
      }
      edges {
        id
        source
        target
        label
        properties
      }
    }
  }
`;let c=(0,s.Ps)`
  mutation CreateComponent($input: ComponentInput!) {
    createComponent(input: $input) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`,f=(0,s.Ps)`
  mutation UpdateComponent($id: Int!, $input: ComponentInput!) {
    updateComponent(id: $id, input: $input) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`,m=(0,s.Ps)`
  mutation DeleteComponent($id: Int!) {
    deleteComponent(id: $id) {
      id
      name
      description
      status
    }
  }
`;(0,s.Ps)`
  mutation CreateRelation($input: RelationInput!) {
    createRelation(input: $input) {
      id
      sourceId
      targetId
      type
      properties
    }
  }
`,function(e){e.ACTIVE="ACTIVE",e.INACTIVE="INACTIVE",e.DEPRECATED="DEPRECATED"}(r||(r={}))},6399:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var n in t)Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}(t,{isNotFoundError:function(){return o},notFound:function(){return r}});let n="NEXT_NOT_FOUND";function r(){let e=Error(n);throw e.digest=n,e}function o(e){return"object"==typeof e&&null!==e&&"digest"in e&&e.digest===n}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},7352:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var n in t)Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}(t,{PARALLEL_ROUTE_DEFAULT_PATH:function(){return o},default:function(){return a}});let r=n(6399),o="next/dist/client/components/parallel-route-default.js";function a(){(0,r.notFound)()}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},4968:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>p,metadata:()=>l});var r=n(9510),o=n(6713),a=n.n(o),i=n(4267),s=n.n(i);n(5023);var d=n(644);let u=(0,n(8570).createProxy)(String.raw`/Users/alexandre/repos/beaver/src/components/providers.tsx#Providers`),l={title:"Beaver - Plataforma de Suporte para Arquitetura e Engenharia",description:"Plataforma moderna para gerenciamento e visualiza\xe7\xe3o de arquitetura de software.",authors:[{name:"Alexandre Nascimento",url:"https://github.com/alexandremn"}]};function p({children:e}){return r.jsx("html",{lang:"pt-BR",suppressHydrationWarning:!0,children:r.jsx("body",{className:(0,d.cn)(a().variable,s().variable,"min-h-screen bg-background font-sans antialiased"),children:r.jsx(u,{children:e})})})}},644:(e,t,n)=>{"use strict";n.d(t,{cn:()=>a});var r=n(5761),o=n(2386);function a(...e){return(0,o.m6)((0,r.W)(e))}},5023:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),r=t.X(0,[625],()=>n(2329));module.exports=r})();