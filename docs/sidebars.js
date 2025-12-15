/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '시작하기',
      items: [
        'getting-started/installation',
        'getting-started/expo-setup',
        'getting-started/rn-cli-setup',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: '가이드',
      items: [
        'guides/wallet-management',
        'guides/transactions',
        'guides/tokens',
        'guides/bridge',
        'guides/flashblocks',
        'guides/giwa-id',
        'guides/dojang',
        'guides/security',
      ],
    },
    {
      type: 'category',
      label: 'API 레퍼런스',
      items: [
        'api/hooks',
        'api/components',
        'api/core',
        'api/types',
      ],
    },
    {
      type: 'category',
      label: '테스트',
      items: [
        'testing/setup',
        'testing/unit-tests',
        'testing/integration-tests',
        'testing/e2e-tests',
      ],
    },
  ],
};

export default sidebars;
