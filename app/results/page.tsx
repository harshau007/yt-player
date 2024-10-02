import SearchResults from "@/components/search-results";

export default function ResultsPage({
  searchParams,
}: {
  searchParams: { q: string };
}) {
  return (
    <main className="min-h-screen p-4">
      <div className="mt-8">
        <SearchResults query={searchParams.q} />
      </div>
    </main>
  );
}
