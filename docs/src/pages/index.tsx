import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs"
          >
            시작하기
          </Link>
          <Link
            className="button button--outline button--lg"
            to="https://github.com/your-username/giwa-react-native-sdk"
            style={{ marginLeft: '1rem' }}
          >
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    title: '간편한 설치',
    emoji: '📦',
    description: 'Expo와 React Native CLI 모두 지원. 한 줄로 설치하고 바로 사용하세요.',
  },
  {
    title: '안전한 지갑',
    emoji: '🔐',
    description: 'iOS Keychain, Android Keystore를 활용한 OS 레벨 보안 저장소.',
  },
  {
    title: '빠른 트랜잭션',
    emoji: '⚡',
    description: 'Flashblocks로 ~200ms 내 트랜잭션 사전 확인.',
  },
  {
    title: 'GIWA ID',
    emoji: '🏷️',
    description: 'ENS 기반 네이밍 서비스. alice.giwa.id로 간편하게.',
  },
  {
    title: 'L1↔L2 브릿지',
    emoji: '🌉',
    description: '이더리움과 GIWA Chain 간 자산 이동.',
  },
  {
    title: 'TypeScript',
    emoji: '💎',
    description: '완벽한 타입 지원으로 안전한 개발 경험.',
  },
];

function Feature({ title, emoji, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="feature-card" style={{ height: '100%', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>빠른 시작</h2>
        <div className="row">
          <div className="col col--6">
            <h3>Expo</h3>
            <pre>
              <code>npx expo install @giwa/react-native-wallet expo-secure-store</code>
            </pre>
          </div>
          <div className="col col--6">
            <h3>React Native CLI</h3>
            <pre>
              <code>npm install @giwa/react-native-wallet react-native-keychain{'\n'}cd ios && pod install</code>
            </pre>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>기본 사용법</h3>
          <pre>
            <code>{`import { GiwaProvider, useGiwaWallet } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <WalletScreen />
    </GiwaProvider>
  );
}

function WalletScreen() {
  const { wallet, createWallet } = useGiwaWallet();

  return wallet ? (
    <Text>주소: {wallet.address}</Text>
  ) : (
    <Button title="지갑 생성" onPress={createWallet} />
  );
}`}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="GIWA Chain SDK for React Native - Expo and React Native CLI compatible"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickStart />
      </main>
    </Layout>
  );
}
