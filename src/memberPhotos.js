import { supabase } from "./supabase";

const BUCKET = "member-photos";
const VERSION_KEY = "just4you_member_photo_versions";

function readVersions() {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(VERSION_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function writeVersions(versions) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VERSION_KEY, JSON.stringify(versions));
}

function setVersion(memberId) {
  const versions = readVersions();
  versions[memberId] = Date.now();
  writeVersions(versions);
  return versions[memberId];
}

function clearVersion(memberId) {
  const versions = readVersions();
  delete versions[memberId];
  writeVersions(versions);
}

function getVersion(memberId) {
  const versions = readVersions();
  return versions[memberId] || "";
}

function getPath(memberId) {
  return `${memberId}/profile`;
}

export function getMemberPhoto(memberId) {
  if (!memberId) return "";
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(getPath(memberId));
  const version = getVersion(memberId);
  return version ? `${data.publicUrl}?v=${version}` : data.publicUrl;
}

export async function saveMemberPhoto(memberId, file) {
  if (!memberId || !file) throw new Error("Member photo file is required.");
  const path = getPath(memberId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    throw error;
  }

  setVersion(memberId);
  return getMemberPhoto(memberId);
}

export async function removeMemberPhoto(memberId) {
  if (!memberId) return;
  const { error } = await supabase.storage.from(BUCKET).remove([getPath(memberId)]);
  if (error) {
    throw error;
  }
  clearVersion(memberId);
}
