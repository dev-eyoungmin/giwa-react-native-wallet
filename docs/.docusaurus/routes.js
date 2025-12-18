import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/giwa-react-native-wallet/en/docs',
    component: ComponentCreator('/giwa-react-native-wallet/en/docs', '87b'),
    routes: [
      {
        path: '/giwa-react-native-wallet/en/docs',
        component: ComponentCreator('/giwa-react-native-wallet/en/docs', 'e91'),
        routes: [
          {
            path: '/giwa-react-native-wallet/en/docs',
            component: ComponentCreator('/giwa-react-native-wallet/en/docs', '08d'),
            routes: [
              {
                path: '/giwa-react-native-wallet/en/docs',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs', '29a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/api/components',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/api/components', '7d8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/api/core',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/api/core', '950'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/api/hooks',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/api/hooks', '05d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/api/types',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/api/types', '419'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/getting-started/expo-setup',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/getting-started/expo-setup', 'dc4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/getting-started/installation',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/getting-started/installation', 'bc5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/getting-started/quick-start',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/getting-started/quick-start', '5be'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/getting-started/rn-cli-setup',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/getting-started/rn-cli-setup', '07a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/bridge',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/bridge', 'c72'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/dojang',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/dojang', 'e5a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/flashblocks',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/flashblocks', 'ec4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/giwa-id',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/giwa-id', 'e79'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/security',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/security', '204'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/tokens',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/tokens', '91d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/transactions',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/transactions', '8c9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/guides/wallet-management',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/guides/wallet-management', '874'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/testing/e2e-tests',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/testing/e2e-tests', '3b9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/testing/integration-tests',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/testing/integration-tests', 'b02'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/testing/setup',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/testing/setup', 'd0f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/giwa-react-native-wallet/en/docs/testing/unit-tests',
                component: ComponentCreator('/giwa-react-native-wallet/en/docs/testing/unit-tests', 'a9e'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/giwa-react-native-wallet/en/',
    component: ComponentCreator('/giwa-react-native-wallet/en/', '096'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
