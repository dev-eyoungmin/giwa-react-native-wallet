// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GIWA React Native SDK',
  tagline: 'GIWA Chain SDK for React Native - Expo and React Native CLI compatible',
  favicon: 'img/favicon.ico',

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
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    localeConfigs: {
      ko: { label: '한국어' },
      en: { label: 'English' },
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
            label: '문서',
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
            title: '문서',
            items: [
              { label: '시작하기', to: '/docs' },
              { label: 'API 레퍼런스', to: '/docs/api/hooks' },
            ],
          },
          {
            title: '커뮤니티',
            items: [
              { label: 'GitHub', href: 'https://github.com/dev-eyoungmin/giwa-react-native-wallet' },
              { label: 'Discord', href: 'https://discord.gg/giwa' },
            ],
          },
          {
            title: '더 보기',
            items: [
              { label: 'GIWA Chain', href: 'https://giwa.io' },
              { label: 'GIWA 공식 문서', href: 'https://docs.giwa.io' },
              { label: 'npm', href: 'https://www.npmjs.com/package/@giwa/react-native-wallet' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} GIWA. Built with Docusaurus.`,
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
