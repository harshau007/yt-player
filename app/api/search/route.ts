import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=10`
    );

    if (!response.ok) {
      throw new Error(`YouTube API responded with status: ${response.status}`);
    }

    const data = await response.json();

    console.log("YouTube API Response:", data);

    if (!data.items || !Array.isArray(data.items)) {
      console.error("Invalid response structure from YouTube API");
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from YouTube API:", error);
    return NextResponse.json(
      { error: "Failed to fetch search results", items: [] },
      { status: 500 }
    );
  }
}
