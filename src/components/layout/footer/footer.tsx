import styles from './component.module.css';
import Image from 'next/image';

export default function Footer() {
  
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>
        <a href={'/'}>
          <img
            className={styles.logo}
            src="/logo/banner.svg"
            alt="Next.js logo"
            width={746}
            height={77}
            loading="lazy"
          />
        </a>
      </div>
    </footer>
  );
}
