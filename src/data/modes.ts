// 편곡(음색) 모드. 숫자 키 1~4 순서와 같다
export type ModeId = 'rock' | 'acoustic' | 'strings' | 'korean';

export const MODE_ORDER: ModeId[] = ['rock', 'acoustic', 'strings', 'korean'];

export const MODES: Record<ModeId, { accent: string }> = {
  rock: { accent: '#ff2a7f' },
  acoustic: { accent: '#b2652a' },
  strings: { accent: '#3a4cd8' },
  korean: { accent: '#d2342a' },
};
