import Player from "@/components/player";

export default function PlayerPage({
  params,
}: {
  params: { videoId: string };
}) {
  return (
    <main className="min-h-screen p-4">
      <Player videoId={params.videoId} />
    </main>
  );
}
