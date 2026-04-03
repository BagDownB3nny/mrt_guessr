import styles from "../css/TutorialWelcomeCard.module.css";

interface Props {
  title: string;
  body: string;
  onStart: () => void;
  onSkip: () => void;
}

export default function TutorialWelcomeCard({ title, body, onStart, onSkip }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.topBar} aria-hidden="true" />
        <div className={styles.body}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.text}>{body}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={onStart} type="button">
            Let&apos;s go!
          </button>
          <button className={styles.secondaryButton} onClick={onSkip} type="button">
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
