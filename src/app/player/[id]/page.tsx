import GameStatusComponent from "@/app/components/GameStatusComponent";
import PlayerComponent from "@/app/components/PlayerComponent";
import styles from './page.module.css';

export default async function PlayerPage({ params }: { params: { id: string } }) {
    const { id: _id } = await params;
    let id: number;

    try {
        const _id = Number.parseInt(params.id);
        console.log("Received ID:", params.id);
        console.log("Parsed ID:", _id);
        if (Number.isNaN(_id) || _id < 1 || _id > 3) {
            throw new Error('Invalid ID');
        }
        id = _id;
    } catch {
        return <div>Invalid player ID. Must be 1, 2, or 3.</div>;
    }

    return (
        <div className={styles.container}>
            <GameStatusComponent />
            <PlayerComponent playerId={id} />
        </div>
    );
}