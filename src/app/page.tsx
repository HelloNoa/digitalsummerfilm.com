import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          src="/main/detail_1.png"
          alt="main detail image"
          width={616}
          height={616}
          priority
        />
        {/*<div className={styles.intro}>*/}
        {/*</div>*/}
      </main>
    </div>
  );
}
