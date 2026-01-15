/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/expo-setup',
        'getting-started/rn-cli-setup',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
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
      label: 'API Reference',
      items: [
        'api/hooks',
        'api/components',
        'api/core',
        'api/types',
        'api/utilities',
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      items: [
        'testing/setup',
        'testing/unit-tests',
        'testing/integration-tests',
        'testing/e2e-tests',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      items: [
        'concepts/blockchain-fundamentals',
      ],
    },
  ],
};

export default sidebars;
