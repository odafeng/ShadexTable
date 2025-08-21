// scripts/generate-routes.js
const fs = require('fs');
const path = require('path');

const routes = [
  { 
    path: 'dashboard/logs',
    component: '@/features/dashboard/pages/logsPage'
  },
  { 
    path: 'dashboard/points',
    component: '@/features/dashboard/pages/dashboardPage'
  },
  // 添加更多路由...
];

routes.forEach(route => {
  const routePath = path.join('src/app', route.path);
  const pageContent = `import Component from '${route.component}';
export default Component;
`;
  
  // 創建目錄
  fs.mkdirSync(routePath, { recursive: true });
  
  // 創建 page.tsx
  fs.writeFileSync(
    path.join(routePath, 'page.tsx'),
    pageContent
  );
});

console.log('Routes generated successfully!');