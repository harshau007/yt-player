import ytdl from "@distube/ytdl-core";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const videoInfo = await ytdl.getInfo(url);
    const audioUrl = ytdl.chooseFormat(videoInfo.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });
    const videoUrl = ytdl.chooseFormat(videoInfo.formats, {
      quality: "lowestvideo",
      filter: "videoonly",
    });
    const resp = {
      title: videoInfo.videoDetails.title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      audio: audioUrl,
      video: videoUrl,
      related: videoInfo.related_videos,
    };

    return NextResponse.json(resp);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error processing video" },
      { status: 500 }
    );
  }
}
