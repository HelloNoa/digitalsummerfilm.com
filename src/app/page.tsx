import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <img
        src="/main/detail_1.png"
        alt="main detail image"
        loading="lazy"
      />
      {/*<div className={styles.intro}>*/}
      {/*</div>*/}
    </div>
  );
}
