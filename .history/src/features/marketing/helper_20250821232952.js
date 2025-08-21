// scripts/generate-routes.js
const fs = require('fs');
const path = require('path');

const routes = [
  { 
    path: 'marketing/about',
    component: '@/features/marketing/pages/aboutPage'
  },
  { 
    path: 'marketing/contact',
    component: '@/features/marketing/pages/contactPage'
  },
  { 
    path: 'marketing/faq',
    component: '@/features/marketing/pages/faqPage'
  },
  { 
    path: 'marketing/features',
    component: '@/features/marketing/pages/featuresPage'
  },
  { 
    path: 'marketing/freeMode',
    component: '@/features/marketing/pages/freeModePage'
  },
  { 
    path: 'marketing/pricing',
    component: '@/features/marketing/pages/pricingPage'
  },
  { 
    path: 'marketing/privacy',
    component: '@/features/marketing/pages/privacyPage'
  },
  { 
    path: 'marketing/technical',
    component: '@/features/marketing/pages/technicalPage'
  },
  { 
    path: 'marketing/terms',
    component: '@/features/marketing/pages/termsPage'
  },
  
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