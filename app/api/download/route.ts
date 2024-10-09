import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { NextResponse } from "next/server";
import stream from "stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const videoInfo = await ytdl.getInfo(url);
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    const audioStream = ytdl(url, { format: audioFormat });
    const outputStream = new stream.PassThrough();

    ffmpeg(audioStream)
      .audioCodec("libmp3lame")
      .toFormat("mp3")
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
      })
      .pipe(outputStream);

    const filename = `${videoInfo.videoDetails.title.replace(
      /[^\w\s]/gi,
      ""
    )}.mp3`;

    return new NextResponse(outputStream as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error processing video for download" },
      { status: 500 }
    );
  }
}
