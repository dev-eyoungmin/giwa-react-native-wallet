// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GIWA React Native SDK',
  tagline: 'GIWA Chain SDK for React Native - Expo and React Native CLI compatible',
  favicon: 'img/favicon.svg',

  // GitHub Pages URL 설정
  url: 'https://dev-eyoungmin.github.io',
  baseUrl: '/giwa-react-native-wallet/',

  // GitHub Pages 배포 설정
  organizationName: 'dev-eyoungmin', // GitHub 사용자명 또는 조직명
  projectName: 'giwa-react-native-wallet', // 저장소 이름
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    localeConfigs: {
      en: { label: 'English' },
      ko: { label: '한국어' },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/dev-eyoungmin/giwa-react-native-wallet/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/giwa-social-card.png',
      navbar: {
        title: 'GIWA SDK',
        logo: {
          alt: 'GIWA Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/dev-eyoungmin/giwa-react-native-wallet',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/docs' },
              { label: 'API Reference', to: '/docs/api/hooks' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'GitHub', href: 'https://github.com/dev-eyoungmin/giwa-react-native-wallet' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'GIWA Chain', href: 'https://giwa.io' },
              { label: 'GIWA Official Docs', href: 'https://docs.giwa.io' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Youngmin Lee. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'typescript', 'json'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;
