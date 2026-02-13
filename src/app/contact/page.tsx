import styles from './page.module.css';

export default function Contact() {
  return (
    <div className={styles.page}>
      <h5>Email</h5>
      <h5>
        <a href="mailto:oyb@digitalsummerfilm.com">oyb@digitalsummerfilm.com</a>
      </h5>
      <h5>
        <a href="mailto:jsh@digitalsummerfilm.com">jsh@digitalsummerfilm.com</a>
      </h5>
      <hr/>
      <h5>INSTAGRAM DM</h5>
      <h5><a href={"https://www.instagram.com/digitalsummer_film/"} target={"_blank"}>@digitalsummer_film</a></h5>
      <hr/>
      <h5>CALL</h5>
      <h5>+82 010-2002-2026</h5>
    </div>
  );
}
