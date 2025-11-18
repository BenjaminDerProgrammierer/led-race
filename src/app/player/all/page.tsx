import GameStatusComponent from "@/app/components/GameStatusComponent";
import PlayerComponent from "@/app/components/PlayerComponent";
import styles from './page.module.css';

export default function PlayerPage() {
    return (
        <main className={styles.container}>
            <h1 className={styles.title}>Overview Page</h1>
            <GameStatusComponent />

            {/* Loop through player IDs 1 to 3 */}
            <div className={styles.playerContainer}>
                {[1, 2, 3].map((id) => (
                    <PlayerComponent playerId={id} key={id} />
                ))}
            </div>
        </main>
    );
}