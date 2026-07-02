import type { HskLevel } from "../types/vocabulary";

export const HSK_LEVELS: HskLevel[] = [1, 2, 3, 4, 5, 6];

export const LEVEL_COLORS: Record<HskLevel, string> = {
  1: "#3f7f72",
  2: "#4f72a7",
  3: "#7b63a8",
  4: "#b0657e",
  5: "#c97745",
  6: "#9a7732",
};

export const PART_OF_SPEECH: Record<string, string> = {
  a: "tính từ",
  ad: "phó tính từ",
  b: "từ phân loại",
  c: "liên từ",
  d: "phó từ",
  e: "thán từ",
  f: "từ phương vị",
  i: "thành ngữ",
  j: "từ viết tắt",
  m: "số từ",
  n: "danh từ",
  nr: "tên riêng",
  ns: "địa danh",
  nt: "tổ chức",
  nz: "danh từ riêng",
  o: "từ tượng thanh",
  p: "giới từ",
  q: "lượng từ",
  r: "đại từ",
  s: "từ chỉ nơi chốn",
  t: "từ chỉ thời gian",
  u: "trợ từ",
  v: "động từ",
  vd: "phó động từ",
  vn: "động danh từ",
  w: "dấu câu",
  x: "từ khác",
};
