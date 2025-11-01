import { BASE_URL, headers } from "@/utils/constants";
import { NewVideoType } from "@/types/videoType";
import { videosObject } from "@/mock/videos";

const baseUrl = BASE_URL;

//change the defaultId and mock boolean
export const getVideos = async (userId: string = "ileri", useMock: boolean = true) => {
  //returns the whole mock json video object(whole video object)
  if (useMock) return videosObject;
  try {
    //fetch videos database json
    const res = await fetch(`${baseUrl}?user_id=${userId}`);
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

export const getVideo = async (videoId: string, useMock: boolean = false) => {
  if (useMock)
  //returns a dictionary of a single video object with key "video"
    return { video: videosObject.videos.find((video) => video.id === videoId) };
  try {
    const res = await fetch(`${baseUrl}/single?video_id=${videoId}`);
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

export const postVideo = async (
  video: NewVideoType | {},
  useMock: boolean = false
) => {
  if (useMock) return;
  try {
    const method = "POST";
    const body = JSON.stringify(video);
    const res = await fetch(baseUrl, { method, headers, body });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

export const putVideo = async (
  video: NewVideoType | {},
  useMock: boolean = false
) => {
  if (useMock) return;
  try {
    const method = "PUT";
    const body = JSON.stringify(video);
    const res = await fetch(baseUrl, { method, headers, body });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};
