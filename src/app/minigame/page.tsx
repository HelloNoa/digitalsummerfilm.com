import styles from './page.module.css';

export default function Contact() {
  return (
    <div className={styles.page}>
      <img
        src="/detail/detail_1.png"
        alt="main detail image"
        width={444}
        height={250}
        loading="lazy"
      />
      <hr/>
      <img
        src="/detail/detail_2.png"
        alt="main detail image"
        width={445}
        height={334}
        loading="lazy"
      />
    </div>
  );
}
