// 챕터 데이터가 함께 쓰는 정의: 장면, 오브젝트
import type { ChordId } from './chords';
import type { ModeId } from './modes';

export interface StepDef<I extends string = string> {
  id: I;
  /** 화면 위쪽 목표 문구 (빈 문자열이면 숨김) */
  objective: string;
  bpm: number;
  mode: ModeId;
}

export type ObjKind = 'isle' | 'lamp' | 'refl' | 'whisper' | 'rock' | 'painting' | 'buoy' | 'thorn' | 'column';

/** 기억 그림의 장면 */
export type PaintingScene = 'room' | 'stage' | 'rain' | 'meet';

export interface ObjDef {
  id: string;
  kind: ObjKind;
  /** 세계 가로 위치 (화면 너비 단위, 배 출발점 = 0) */
  wx?: number;
  /** 배에 붙어 다니는 것: 배 기준 가로 위치 (0.5 = 배 바로 아래) */
  rx?: number;
  /** 수평선(0)~바다 아래 끝(1) 사이 높이 */
  ry?: number;
  /** 섬 크기 배율 */
  s?: number;
  /** 섬 모양 난수 seed */
  seed?: number;
  /** 등불·부표가 반응하는 코드 */
  chord?: ChordId;
  /** pp(아주 여리게)로만 보이는 것 */
  pp?: boolean;
  /** 장면이 정할 때까지 파동에도 드러나지 않음 */
  hidden?: boolean;
  /** 기억 그림: 장면, 너비(화면 너비 단위), 액자 밖 그 사람이 서 있는 쪽 */
  scene?: PaintingScene;
  w?: number;
  edge?: 'left' | 'right';
  /** 빗방울 기둥이 들려주는 코드 순서 */
  seq?: ChordId[];
}
